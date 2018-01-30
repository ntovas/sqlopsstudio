import * as vscode from 'vscode';
import { XelDocumentContextProvider } from './xelContentProvider';
import * as path from 'path';

function activate(context: vscode.ExtensionContext): void {
	const provider = new XelDocumentContextProvider(context);
	const registerProvider = vscode.workspace.registerTextDocumentContentProvider('xel-preview', provider);

	const openedEvent = vscode.workspace.onDidOpenTextDocument((document: vscode.TextDocument) => {
		showDocumentPreview(document);
	});

	context.subscriptions.push(registerProvider, openedEvent);
}

function showDocumentPreview(document: vscode.TextDocument): void {
	if (document.languageId === 'xel' && document.uri.scheme !== 'xel-preview') {
		vscode.commands.executeCommand('workbench.action.closeActiveEditor').then(() => {
			showPreview(document.uri);
		});
	}
}

function showPreview(uri: vscode.Uri): void {
	if (uri.scheme === 'xel-preview') {
		return;
	}

	let columns = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : 1;
	let basename = path.basename(uri.fsPath);
	vscode.commands.executeCommand('vscode.previewHtml',
		buildPreviewUri(uri),
		columns,
		basename)
		.then(null, vscode.window.showErrorMessage);
}

function buildPreviewUri(uri: vscode.Uri): vscode.Uri {
	return uri.with({
		scheme: 'xel-preview',
		path: uri.path + '.rendered.xel',
		query: uri.toString(),
	});
}

function deactive() {
}
