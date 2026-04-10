# MCP Server Template

This template is the starting point for new internal MCP servers.

## Features

- MCP SDK server bootstrap
- Example tool and resource
- `stdio` and `sse` transport options
- Container-friendly Dockerfile

## Usage

1. Copy this directory into a new service repository or workspace package.
2. Update the server name, version, and tool/resource definitions.
3. Install dependencies.
4. Run locally with the dev script.

## Environment

- `MCP_TRANSPORT=stdio|sse`
- `PORT=8788`
