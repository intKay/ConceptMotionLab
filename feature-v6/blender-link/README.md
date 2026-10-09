# Blender 本地连接

配置日期：2026-10-09。用户授权配置 Blender 连接。

- Blender：`C:\Program Files\Blender Foundation\Blender 5.2\blender.exe`，5.2.2 LTS。
- 社区桥接包：`mcp-for-blender==2.1.9`，不是 Blender 官方插件。
- 插件：`%APPDATA%\Blender Foundation\Blender\5.2\scripts\addons\blender_mcp.py`，已启用并保存偏好。
- Codex 项目配置：`C:\AIProjects\Concept-Motion-Lab\.codex\config.toml`，未改 Codex 全局配置。
- 本机端点：`127.0.0.1:9876`。插件随 Blender 打开自动启动。手动入口：3D 视图按 N → MCP for Blender。
- `DISABLE_TELEMETRY=true`；插件 `telemetry_consent=false`。外部素材/生成服务未启用。
- 依赖及工具缓存保存在本目录的 `cache/` 和 `tools/`，已加入本目录 `.gitignore`。不要删除缓存，否则离线启动无法工作。

## 使用

打开 Blender，并重新打开当前项目的 Codex 聊天以加载新增 MCP 工具。先要求读取当前场景；确认正确场景后再开始建模。当前聊天中新增工具尚未直接调用，下面验证使用独立 MCP 客户端。

## 实际验证

1. `blender.exe --version`：5.2.2 LTS。
2. `uvx --offline mcp-for-blender install-addon --addons-dir ...`：成功安装。
3. `blender.exe --background --python feature-v6/blender-link/enable-addon.py`：成功启用、保存偏好，遥测同意为 false。
4. `codex mcp get blender`：enabled=true、stdio、固定版本、项目路径环境变量。
5. `uvx --offline --from mcp-for-blender==2.1.9 python feature-v6/blender-link/verify.py`：MCP initialize、list_tools、get_scene_info 均成功；返回 9 个工具和默认场景的 Cube、Camera、Light。结果见 `verification.json`。

验证启动了一个 Blender 进程，未修改或保存模型。未做建模、动画或渲染验证。

来源：[社区项目](https://github.com/ahujasid/mcp-for-blender)、[Codex MCP 文档](https://developers.openai.com/codex/mcp)。
