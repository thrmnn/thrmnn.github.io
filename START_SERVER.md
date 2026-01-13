# Start Hugo Server

To make your website accessible on localhost, run:

```bash
cd /home/theo/thrmnn.github.io
hugo server --bind 0.0.0.0 --port 1313
```

This will:
- Start the Hugo development server
- Bind to all interfaces (0.0.0.0) so it's accessible
- Use port 1313
- Watch for file changes and auto-reload

## Access Your Website

Once the server is running, open in your browser:
- **Local:** http://localhost:1313/
- **Network:** http://YOUR_IP:1313/ (if accessing from another device)

## Stop the Server

Press `Ctrl+C` in the terminal where Hugo is running.

## Background Mode

To run in the background:
```bash
hugo server --bind 0.0.0.0 --port 1313 > /tmp/hugo.log 2>&1 &
```

To check if it's running:
```bash
ps aux | grep "hugo server"
```

To stop a background server:
```bash
pkill -f "hugo server"
```

## Verify It's Working

Test with:
```bash
curl http://localhost:1313/
```

You should see HTML output.
