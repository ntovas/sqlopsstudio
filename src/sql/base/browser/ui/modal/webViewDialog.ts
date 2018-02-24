/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import 'vs/css!sql/media/icons/common-icons';
import { Button } from 'sql/base/browser/ui/button/button';
import { Modal } from 'sql/base/browser/ui/modal/modal';
import * as TelemetryKeys from 'sql/common/telemetryKeys';
import { attachButtonStyler, attachModalDialogStyler } from 'sql/common/theme/styler';
import { Builder } from 'vs/base/browser/builder';
import { IThemeService } from 'vs/platform/theme/common/themeService';
import { IPartService, Parts } from 'vs/workbench/services/part/common/partService';
import Event, { Emitter } from 'vs/base/common/event';
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry';
import { IContextKeyService } from 'vs/platform/contextkey/common/contextkey';
import { IClipboardService } from 'vs/platform/clipboard/common/clipboardService';
import { localize } from 'vs/nls';
import WebView from 'vs/workbench/parts/html/browser/webview';
import { IContextViewService } from 'vs/platform/contextview/browser/contextView';
import { IEnvironmentService } from 'vs/platform/environment/common/environment';
import { IDisposable, toDisposable } from 'vs/base/common/lifecycle';

export class WebViewDialog extends Modal {

	private _body: HTMLElement;
	private _okButton: Button;
	private _okLabel: string;
	private _closeLabel: string;
	private _webview: WebView;
	private _html: string;
	private _headerTitle: string;

	private _onOk = new Emitter<void>();
	public onOk: Event<void> = this._onOk.event;
	private _onClosed = new Emitter<void>();
	public onClosed: Event<void> = this._onClosed.event;
	private contentDisposables: IDisposable[] = [];
	private _onMessage = new Emitter<any>();

	constructor(
		@IThemeService private _themeService: IThemeService,
		@IClipboardService private _clipboardService: IClipboardService,
		@IPartService private _webViewPartService: IPartService,
		@ITelemetryService telemetryService: ITelemetryService,
		@IContextKeyService contextKeyService: IContextKeyService,
		@IContextViewService private _contextViewService: IContextViewService,
		@IEnvironmentService private _environmentService: IEnvironmentService,
	) {
		super('', TelemetryKeys.WebView, _webViewPartService, telemetryService, contextKeyService, { isFlyout: false, hasTitleIcon: true });
		this._okLabel = localize('OK', 'OK');
		this._closeLabel = localize('close', 'Close');
	}

	public set html(value: string) {
		this._html = value;
	}

	public get html(): string {
		return this._html;
	}

	public set okTitle(value: string) {
		this._okLabel = value;
	}

	public get okTitle(): string {
		return this._okLabel;
	}

	public set closeTitle(value: string) {
		this._closeLabel = value;
	}

	public get closeTitle(): string {
		return this._closeLabel;
	}

	public set headerTitle(value: string) {
		this._headerTitle = value;
	}

	public get headerTitle(): string {
		return this._headerTitle;
	}

	protected renderBody(container: HTMLElement) {
		new Builder(container).div({ 'class': 'webview-dialog' }, (bodyBuilder) => {
			this._body = bodyBuilder.getHTMLElement();
			this._webview = new WebView(this._body, this._webViewPartService.getContainer(Parts.EDITOR_PART),
				this._contextViewService,
				undefined,
				undefined,
				{
					allowScripts: true,
					enableWrappedPostMessage: true,
					hideFind: true
				}
			);

			this._webview.style(this._themeService.getTheme());

			this._webview.onMessage(message => {
				this._onMessage.fire(message);
			}, null, this.contentDisposables);

			this._themeService.onThemeChange(theme => this._webview.style(theme), null, this.contentDisposables);

			this.contentDisposables.push(this._webview);
			this.contentDisposables.push(toDisposable(() => this._webview = null));
		});
	}

	get onMessage(): Event<any> {
		return this._onMessage.event;
	}

	public render() {
		super.render();
		this._register(attachModalDialogStyler(this, this._themeService));

		this._okButton = this.addFooterButton(this._okLabel, () => this.ok());
		this._register(attachButtonStyler(this._okButton, this._themeService));
	}

	protected layout(height?: number): void {
		// Nothing to re-layout
	}

	private updateDialogBody(): void {
		this._webview.contents = [this.html];
	}

	/* espace key */
	protected onClose() {
		this.ok();
	}

	/* enter key */
	protected onAccept() {
		this.ok();
	}

	public ok(): void {
		this._onOk.fire();
		this.close();
	}

	public close() {
		this.hide();
		this._onClosed.fire();
	}

	public sendMessage(message: any): void {
		this._webview.sendMessage(message);
	}

	public open() {
		this.title = this.headerTitle;
		this.updateDialogBody();
		this.show();
		this._okButton.focus();
	}

	public dispose(): void {
		this.contentDisposables.forEach(element => {
			element.dispose();
		});
	}
}