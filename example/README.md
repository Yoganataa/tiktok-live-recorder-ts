# Usage Examples

This directory contains scripts demonstrating the capabilities of the `tstok` library.

## Setup

1.  **Install Dependencies**:
    Ensure you have installed the project dependencies in the root directory.

    ```bash
    npm install
    ```

2.  **Configuration**:
    Copy the example environment file and configure your credentials.
    ```bash
    cp example/env.example example/.env
    ```

    - **Required**: `TIKTOK_SESSIONID_SS` (Get this from your browser cookies on tiktok.com).
    - **Required**: `TIKTOK_USERNAME` (For manual recording).

## Available Scripts

Run these scripts using `tsx` from the project root.

### 1. Manual Recording

Records a specific user defined in your `.env` file. It connects, records, and processes the stream into an MP4/MKV file.

```bash
npx tsx example/manual.ts
```
