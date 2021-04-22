import * as path from 'path';
import * as vscode from 'vscode';

import { LanguageClient, LanguageClientOptions, ProtocolRequestType0, ServerOptions } from 'vscode-languageclient/node';

let client: LanguageClient

// Launcher constants
const launcherMain: string = 'com.tson.lsp.TSONLauncher';
const launcherFilename: string = 'tson-lsp.jar'

//const launcherMain: string = 'StdioLauncher';
//const launcherFilename: string = 'launcher.jar'

export function activate(context: vscode.ExtensionContext) {
    console.log('Initializing language server for language TSON')

    // Get the java home from the process environment.
    const { JAVA_HOME } = process.env;
    console.log('Using Java from JAVA_HOME: ' + JAVA_HOME)

    // Only start if JAVA_HOME exists
    if (!JAVA_HOME) {
        console.log('Initialization cancelled. JAVA_HOME not found.')
    } else {
        // Java execution path
        let excecutable: string = path.join(JAVA_HOME, 'bin', 'java');

        // PSL Server launcher
        //let classPath = path.join(__dirname, '..', '..', 'launcher', launcherFilename);
        let classPath = 'E:\\Andre\\Personal Projects\\TSON\\lsp-lsp4j\\tson-lsp\\build\\libs\\tson-lsp-1.0-SNAPSHOT.jar'
        const args: string[] = ['-cp', classPath, launcherMain];

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
            documentSelector: [{ scheme: 'file', language: 'tson' }]
        };

        // Create client
        client = new LanguageClient('tsonLS', 'Language Server for TSON', serverOptions, clientOptions)

        // Create the language client and start the client.
        let disposable = client.start();

        // Disposables to remove on deactivation.
        context.subscriptions.push(disposable);
    }
}

export function deactivate() {
    console.log('Deactivated language server for language TSON')
}