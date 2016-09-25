# monomorphist
## a JavaScript performance companion

rough overview:

Two textboxes:

1. Paste a JS function.
2. Paste a call to this JS function.

Workflow:

1. Fill in the two textboxes
2. Hit run (choose which node versions to target?)
3. It gets instrumented on the server
4. The server spawns containers to run the code
5. The result is streamed to the client

## architecture
```
containers: [http] ← ws → [server]

                            ↑
                          syslog
                            ↓

containers: [node 0.10] [node 0.12] [node 4] [node 5] [node 6] …
```

### bailout and deopt

Split pane with explanation and tips about a bailout or deopt.

[IRHydra](https://github.com/mraleph/irhydra) ?

### TODO

- [x] Security? Node containers shouldn't be able to network at all
