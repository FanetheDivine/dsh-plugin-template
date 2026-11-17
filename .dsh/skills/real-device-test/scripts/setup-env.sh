#!/bin/bash
# 搭建实机测试环境：对齐宿主版本、创建 profile、安装插件、写隔离配置、复制驱动脚本、注册工作区。
# 用法：bash setup-env.sh <插件仓库绝对路径> [profile名]
# 前置：仓库已运行 pnpm i && pnpm check，dist/index.mjs 存在。
set -euo pipefail
REPO_IN=${1:?用法: bash setup-env.sh <插件仓库绝对路径> [profile名]}
REPO=$(cygpath -m "$REPO_IN")   # D:/... 形式，供 node 与 dsh 使用
REPO_U=$(cygpath -u "$REPO_IN") # /d/... 形式，供 bash 使用
PLUGIN=$(node -p "require(process.argv[1]).name" "$REPO/package.json")
PROFILE=${2:-rdt-$(date +%Y%m%d)}
DSH_ROOT=$(cygpath -u "${DSH_HOME:-$HOME/.dsh}")
PDIR_U="$DSH_ROOT/profiles/$PROFILE"
PDIR=$(cygpath -m "$PDIR_U")
SCRIPTS_DIR=$(cd "$(dirname "$0")" && pwd)

echo "== 1/6 对齐宿主版本"
# 默认取 @deepseek-ai/dsh-agent 的版本，RDT_DSH_VERSION 可指定其他宿主版本
WANT=${RDT_DSH_VERSION:-$(node -p "require(process.argv[1]).devDependencies['@deepseek-ai/dsh-agent'] ?? ''" "$REPO/package.json")}
WANT=${WANT#^}
WANT=${WANT#\~}
[ -n "$WANT" ] || { echo "package.json 缺少 @deepseek-ai/dsh-agent 依赖"; exit 1; }
HAVE=$(dsh --version 2>/dev/null || echo "")
HOST_ENV=""
if [ "$HAVE" = "$WANT" ]; then
  echo "使用全局 dsh $HAVE"
else
  LOCAL_U="$HOME/.dsh-local/dsh-$WANT"
  # 依赖按宿主发布时间解析，避免 caret 范围拉到之后发布的不兼容版本；.rdt-pinned 标记已按此方式安装
  if [ "$("$LOCAL_U/node_modules/.bin/dsh" --version 2>/dev/null)" != "$WANT" ] || [ ! -f "$LOCAL_U/.rdt-pinned" ]; then
    echo "全局 dsh 为 ${HAVE:-未安装}，插件需要 $WANT，安装到 $LOCAL_U"
    BEFORE=$(npm view "@deepseek-ai/dsh@$WANT" time --json | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>process.stdout.write(JSON.parse(s)[process.argv[1]]))" "$WANT")
    rm -rf "$LOCAL_U"
    mkdir -p "$LOCAL_U"
    (cd "$LOCAL_U" && npm init -y >/dev/null && npm i --no-audit --no-fund --before="$BEFORE" "@deepseek-ai/dsh@$WANT")
    echo "$BEFORE" >"$LOCAL_U/.rdt-pinned"
  fi
  export PATH="$LOCAL_U/node_modules/.bin:$PATH"
  RDT_DSH_PKG="$(cygpath -m "$LOCAL_U")/node_modules/@deepseek-ai/dsh/package.json"
  export RDT_DSH_PKG
  HAVE=$(dsh --version)
  [ "$HAVE" = "$WANT" ] || { echo "本地宿主版本为 $HAVE，期望 $WANT"; exit 1; }
  HOST_ENV="export PATH=\"$LOCAL_U/node_modules/.bin:\$PATH\" RDT_DSH_PKG=$RDT_DSH_PKG"
  echo "使用本地 dsh $HAVE"
fi

echo "== 2/6 检查 dist"
[ -f "$REPO_U/dist/index.mjs" ] || { echo "缺少 dist/index.mjs，先在仓库运行 pnpm check"; exit 1; }

echo "== 3/6 创建 profile"
if [ -d "$PDIR_U" ]; then
  echo "复用已有 profile $PROFILE"
elif ! dsh --profile "$PROFILE" --from-default-profile web --dump-config >/dev/null 2>&1; then
  # 旧版宿主没有 --from-default-profile，按其内置 web 模板写 profile 清单
  echo "宿主不支持 --from-default-profile，按 web 模板创建"
  mkdir -p "$PDIR_U"
  node -e "require('fs').writeFileSync(process.argv[1], JSON.stringify({
    name: 'dsh-profile-' + process.argv[2], private: true, dependencies: {},
    dsh: { profile: { bundles: ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app'] } },
  }, null, 2) + '\n')" "$PDIR/package.json" "$PROFILE"
fi

echo "== 4/6 安装插件"
# tgz 留在 profile 目录：profile 的 package.json 以 file: 依赖指向它
TGZ=$(cd "$REPO_U" && pnpm pack --pack-destination "$PDIR_U" | tail -1)
dsh plugin --profile "$PROFILE" add "$(cygpath -m "$TGZ")"

echo "== 5/6 写隔离配置并复制驱动脚本"
# 预先确认宿主的欢迎弹窗：版本号须与宿主内置常量完全一致，旧版宿主没有该常量时跳过
DSH_PKG=${RDT_DSH_PKG:-$(cygpath -m "$(npm root -g)")/@deepseek-ai/dsh/package.json}
WELCOME=$(node -e "
const r = require('module').createRequire(process.argv[1]);
try {
  const f = r.resolve('@deepseek-ai/dsh-client-ui-settings-models/package.json').replace(/package\.json$/, 'lib/types/onboarding-copy.d.ts');
  const m = /WELCOME_NOTICE_VERSION = \"([^\"]+)\"/.exec(require('fs').readFileSync(f, 'utf8'));
  process.stdout.write(m ? m[1] : '');
} catch {}" "$DSH_PKG")
WELCOME_PATCH=""
[ -n "$WELCOME" ] && WELCOME_PATCH="- id: ui-settings-general
  config:
    welcomeNoticeVersion: \"$WELCOME\"
"
if grep -q "rdt-mock" "$PDIR_U/cordis.patch.yml" 2>/dev/null; then
  echo "cordis.patch.yml 已含测试配置，保留"
else
  cat >"$PDIR_U/cordis.patch.yml" <<EOF
# 实机测试隔离配置：停用真实模型，会话与存储写入 profile 目录，mock provider 由末尾 insert 加载。
- id: $PLUGIN
  config:
    prefix: rdt
- id: agent-default-model
  config:
    provider: mock
    model: mock-model
- id: llm-deepseek
  disabled: true
- id: llm-deepseek-account
  disabled: true
- id: llm-pi-ai
  disabled: true
- id: session-title-llm
  disabled: true
- id: session-persistence-jsonl
  config:
    root: $PDIR/test-sessions
    compression: none
- id: storage-json
  config:
    root: $PDIR/test-storage
- id: credentials
  config:
    path: $PDIR/test-credentials.yaml
${WELCOME_PATCH}- insert:
    - id: rdt-mock
      name: file:///$PDIR/mock-provider.mjs
EOF
fi
mkdir -p "$PDIR_U/test-sessions" "$PDIR_U/test-storage" "$PDIR_U/shots"
cp "$SCRIPTS_DIR/mock-provider.mjs" "$SCRIPTS_DIR/run-test.mjs" "$PDIR_U/"

echo "== 6/6 注册测试工作区"
node "$SCRIPTS_DIR/register-workspace.mjs" "$PDIR_U" "$REPO"

cat <<EOF

环境就绪。依次执行：
  ${HOST_ENV:-# 全局宿主，无需额外 env}
  export RDT_PROFILE=$PROFILE RDT_PROFILE_DIR=$PDIR RDT_REPO=$REPO
  cd $PDIR_U
  node run-test.mjs                               # 后端用例
  eval \$(bash $SCRIPTS_DIR/gui-up.sh $PROFILE)   # 启动 GUI 并导出 RDT_GUI_URL
  cd $REPO_U && node $SCRIPTS_DIR/browser-test.mjs   # 浏览器用例
browser-test.mjs 依赖仓库的 playwright，因此在仓库内运行。
EOF
