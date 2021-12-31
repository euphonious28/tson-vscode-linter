import * as path from 'path';
import * as vscode from 'vscode';

import { LanguageClient, LanguageClientOptions, ProtocolRequestType0, ServerOptions } from 'vscode-languageclient/node';

let client: LanguageClient;

// Launcher constants
const launcherMain: string = 'com.tson.lsp.Launcher';
const launcherPath: string = vscode.workspace.getConfiguration('tson').get('path.lsp');

export function activate(context: vscode.ExtensionContext) {
    console.log('Initializing language server for language TSON');

    // Get the java home from the process environment.
    const { JAVA_HOME } = process.env;
    console.log('Using Java from JAVA_HOME: ' + JAVA_HOME);

    // Log launcher path
    console.log('Using TSON-LSP from: ' + launcherPath);

    // Only start if JAVA_HOME exists
    if (!JAVA_HOME) {
        console.log('Initialization cancelled. JAVA_HOME not found.');
    } else {
        // Java execution path
        let excecutable: string = path.join(JAVA_HOME, 'bin', 'java');

        // LSP launcher path
        const args: string[] = ['-cp', launcherPath, launcherMain];

        // Server options
        // -- java execution path
        // -- argument to be pass when executing the java command
        let serverOptions: ServerOptions = {
            command: excecutable,
            args: [...args],
            options: {}
        };

        // Client options
        let clientOptions: LanguageClientOptions = {
            // Register the server for plain text documents
            documentSelector: [{ scheme: 'file', language: 'tson' }],
            errorHandler: {
                error: (error, message, count) => {
                    console.log('Initialization error');
                    return 2;
                },
                closed: () => {
                    console.log('Closed');
                    vscode.window.showErrorMessage(
                        "Failed to start TSON extension. Ensure that your settings are correct",
                        "View settings"
                    ).then((value) => {
                        vscode.commands.executeCommand('workbench.action.openSettings', 'tson.path.lsp')
                    })
                    return 1;
                }
            }
        };

        // Create client
        console.log("Creating new client using TSON from: " + launcherPath);
        client = new LanguageClient('tsonLS', 'Language Server for TSON', serverOptions, clientOptions);

        // Create the language client and start the client.
        let disposable = client.start();

        // Disposables to remove on deactivation.
        context.subscriptions.push(disposable);
    }
}

export function deactivate() {
    console.log('Deactivated language server for language TSON');
}