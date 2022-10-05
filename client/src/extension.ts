import * as path from 'path';
import * as vscode from 'vscode';
import * as net from 'net';
import * as child_process from 'child_process';

import { ClientCapabilities, DocumentSelector, DynamicFeature, FoldingRangeClientCapabilities, InitializeParams, LanguageClient, LanguageClientOptions, ProtocolRequestType0, SemanticTokens, SemanticTokensClientCapabilities, ServerCapabilities, ServerOptions, StaticFeature, StreamInfo, WorkspaceClientCapabilities } from 'vscode-languageclient/node';

let client: LanguageClient;

// Launcher constants
const lspMainClass: string = 'com.tson.lsp.Launcher';
const { JAVA_HOME } = process.env;
const outputChannel: vscode.OutputChannel = vscode.window.createOutputChannel('TSON LSP')

export function activate(context: vscode.ExtensionContext) {
    outputChannel.appendLine('Initializing language server for language TSON');

    // Only start if JAVA_HOME exists
    if (!JAVA_HOME) {
        outputChannel.appendLine('Initialization cancelled. JAVA_HOME not found.');
    } else {

        // Server initialization promise
        function createServer(): Promise<StreamInfo> {
            return new Promise((resolve, reject) => {
                // Create a new server
                let server: net.Server = net.createServer((socket) => {
                    outputChannel.appendLine('Creating server for LSP');
                    resolve({
                        reader: socket,
                        writer: socket
                    });

                    socket.on('end', () => outputChannel.appendLine('Server disconnected'));
                }).on('error', (err) => {
                    outputChannel.appendLine('Failed to start error. Details: ' + err);
                });

                // Grab a random port
                server.listen(() => {
                    // LSP args
                    const args: string[] = [
                        // '-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005',
                        '-cp', getTsonLsp(), lspMainClass,
                        (server.address() as net.AddressInfo).port.toString()
                    ];

                    // Start LSP
                    let process = child_process.spawn(getJavaExec(), args);
                    process.stdout.on('data', data => {
                        outputChannel.appendLine(data.toString());
                    })
                    process.stderr.on('data', data => {
                        outputChannel.appendLine(data.toString());
                    })
                });
            });
        }

        // Client options
        let clientOptions: LanguageClientOptions = {
            // Register the server for plain text documents
            documentSelector: [{ scheme: 'file', language: 'tson' }],
            errorHandler: {
                error: (error, message, count) => {
                    outputChannel.appendLine('Initialization error');
                    return 2;
                },
                closed: () => {
                    outputChannel.appendLine('Closed');
                    vscode.window.showErrorMessage(
                        "Failed to start TSON extension. Ensure that your settings are correct",
                        "View settings"
                    ).then((value) => {
                        vscode.commands.executeCommand('workbench.action.openSettings', 'tson.path.lsp')
                    })
                    return 1;
                }
            },
            outputChannel: outputChannel,
            traceOutputChannel: outputChannel
        };

        // Create Language Client
        client = new LanguageClient('tsonLS', 'Language Server for TSON', createServer, clientOptions);

        // Register client capabilities
        client.registerFeature({
            fillInitializeParams(params: InitializeParams): void {
                params.trace = 'verbose';
            },
            fillClientCapabilities(capabilities: ClientCapabilities): void {
                capabilities.textDocument.semanticTokens.multilineTokenSupport = true;
            },
            initialize(): void { },
            dispose(): void { }
        });

        client.registerProposedFeatures();

        // Create the language client and start the client.
        let disposable = client.start();

        // Disposables to remove on deactivation.
        context.subscriptions.push(disposable);
    }
}

export function deactivate() {
    outputChannel.appendLine('Deactivated language server for language TSON');
}

function getJavaExec(): string {
    outputChannel.appendLine('Using Java from JAVA_HOME: ' + JAVA_HOME);

    return path.join(JAVA_HOME, 'bin', 'java');
}

function getTsonLsp(): string {
    // Log launcher path
    const lspPath: string = vscode.workspace.getConfiguration('tson').get('path.lsp');
    outputChannel.appendLine('Using TSON-LSP from: ' + lspPath);

    return lspPath;
}