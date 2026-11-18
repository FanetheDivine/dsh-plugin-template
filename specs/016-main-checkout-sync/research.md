# Research: 主工作区约束与 main 同步

## R1 同步方式

- Decision: 先 `git fetch origin main`，确认本地 `main` 是 `origin/main` 的祖先，再运行 `git pull --ff-only origin main`。
- Rationale:
  - 主工作区只允许 `git fetch` 与 `git pull`。
  - 祖先检查能区分「已分叉」与网络错误，给出准确原因。
  - `--ff-only` 保证不产生合并提交，不改写本地提交。
- Alternatives considered:
  - `git merge --ff-only origin/main`：效果相同，但在主工作区运行 `merge` 违反约束。
  - `git reset --hard origin/main`：会丢弃本地提交。

## R2 脚本形态

- Decision: 新增独立脚本 `sync-main.sh`，由扩展命令在创建前与清理后各调用一次。
- Rationale:
  - 主工作区内的脚本会被 `git pull` 更新。bash 边读边执行，脚本在运行中被改写会读到错位内容。
  - 独立脚本先运行完毕，`create-worktree.sh` 再以更新后的版本启动。
  - `finish-worktree.sh` 在同步前已经结束。
  - `sync-main.sh` 自身的逻辑包在函数中，`main "$@"; exit $?` 写在同一行，bash 在执行前完整解析。
- Alternatives considered:
  - 在 `create-worktree.sh` 内调用同步：pull 后脚本继续读取被改写的自身文件。
  - 在 `finish-worktree.sh` 末尾调用同步：同样的问题，且清理与同步的失败难以区分。

## R3 失败分类

- Decision: 退出码 0 表示已同步；2 表示主工作区不满足约束；1 表示其他错误。
- Rationale: 调用方据此区分「需要用户处理主工作区」与「网络或 git 错误」。
- 退出码 2 的三种情形：
  - 不在 `main` 分支，含 detached HEAD。
  - `git status --porcelain` 非空。被忽略的文件不计入。
  - 本地 `main` 含有 `origin/main` 之外的提交。

## R4 skill 渲染

- Decision: 手工编辑 `commands/*.md`，再把正文同步到 `.dsh/skills/speckit-worktree-*/SKILL.md`，保留 SKILL.md 的 front matter。
- Rationale: 本机没有 `specify` CLI。SKILL.md 等于 front matter 加命令正文，手工同步结果与渲染一致。
- Alternatives considered: 安装 `specify` CLI 重新渲染，引入与本需求无关的环境依赖。

## R5 主工作区的定位

- Decision: 取 `git worktree list --porcelain` 的第一项。
- Rationale: 与 `create-worktree.sh`、`finish-worktree.sh` 一致，在任意 worktree 内运行都能找到主工作区。
