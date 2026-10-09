import asyncio
import json
import os
from pathlib import Path
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async def main():
    params = StdioServerParameters(
        command=r'C:\Users\15760\AppData\Local\hermes\bin\uvx.exe',
        args=['--offline', 'mcp-for-blender==2.1.9'],
        env={**os.environ, 'DISABLE_TELEMETRY': 'true', 'BLENDER_HOST': '127.0.0.1', 'BLENDER_PORT': '9876'},
    )
    async with stdio_client(params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            tools = await session.list_tools()
            result = await session.call_tool('get_scene_info', {})
            report = {'tools': [t.name for t in tools.tools], 'scene': result.model_dump(mode='json')}
            Path(__file__).with_name('verification.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
            print(json.dumps(report, ensure_ascii=False))
            if result.isError:
                raise RuntimeError('Scene read failed')

asyncio.run(main())
