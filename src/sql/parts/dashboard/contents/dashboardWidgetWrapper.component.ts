/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import 'vs/css!sql/media/icons/common-icons';
import 'vs/css!./dashboardWidgetWrapper';

import {
	Component, Input, Inject, forwardRef, ComponentFactoryResolver, AfterContentInit, ViewChild,
	ElementRef, OnInit, ChangeDetectorRef, OnDestroy, ReflectiveInjector, Injector, Type, ComponentRef
} from '@angular/core';

import { ComponentHostDirective } from 'sql/parts/dashboard/common/componentHost.directive';
import { WidgetConfig, WIDGET_CONFIG, IDashboardWidget } from 'sql/parts/dashboard/common/dashboardWidget';
import { Extensions, IInsightRegistry } from 'sql/platform/dashboard/common/insightRegistry';
import { error } from 'sql/base/common/log';
import { RefreshWidgetAction, ToggleMoreWidgetAction, DeleteWidgetAction } from 'sql/parts/dashboard/common/actions';

/* Widgets */
import { PropertiesWidgetComponent } from 'sql/parts/dashboard/widgets/properties/propertiesWidget.component';
import { ExplorerWidget } from 'sql/parts/dashboard/widgets/explorer/explorerWidget.component';
import { TasksWidget } from 'sql/parts/dashboard/widgets/tasks/tasksWidget.component';
import { InsightsWidget } from 'sql/parts/dashboard/widgets/insights/insightsWidget.component';
import { WebviewWidget } from 'sql/parts/dashboard/widgets/webview/webviewWidget.component';

import { DashboardServiceInterface } from 'sql/parts/dashboard/services/dashboardServiceInterface.service';

import { IDisposable } from 'vs/base/common/lifecycle';
import { IColorTheme } from 'vs/workbench/services/themes/common/workbenchThemeService';
import * as colors from 'vs/platform/theme/common/colorRegistry';
import * as themeColors from 'vs/workbench/common/theme';
import { Action } from 'vs/base/common/actions';
import { Registry } from 'vs/platform/registry/common/platform';
import { ActionBar } from 'vs/base/browser/ui/actionbar/actionbar';

const componentMap: { [x: string]: Type<IDashboardWidget> } = {
	'properties-widget': PropertiesWidgetComponent,
	'explorer-widget': ExplorerWidget,
	'tasks-widget': TasksWidget,
	'insights-widget': InsightsWidget,
	'webview-widget': WebviewWidget
};

@Component({
	selector: 'dashboard-widget-wrapper',
	templateUrl: decodeURI(require.toUrl('sql/parts/dashboard/contents/dashboardWidgetWrapper.component.html'))
})
export class DashboardWidgetWrapper implements AfterContentInit, OnInit, OnDestroy {
	@Input() private _config: WidgetConfig;
	private _themeDispose: IDisposable;
	private _actions: Array<Action>;
	private _component: IDashboardWidget;
	private _actionbar: ActionBar;

	@ViewChild('header', { read: ElementRef }) private header: ElementRef;
	@ViewChild('actionbar', { read: ElementRef }) private _actionbarRef: ElementRef;
	@ViewChild(ComponentHostDirective) componentHost: ComponentHostDirective;

	constructor(
		@Inject(forwardRef(() => ComponentFactoryResolver)) private _componentFactoryResolver: ComponentFactoryResolver,
		@Inject(forwardRef(() => ElementRef)) private _ref: ElementRef,
		@Inject(forwardRef(() => DashboardServiceInterface)) private _bootstrap: DashboardServiceInterface,
		@Inject(forwardRef(() => ChangeDetectorRef)) private _changeref: ChangeDetectorRef,
		@Inject(forwardRef(() => Injector)) private _injector: Injector
	) { }

	ngOnInit() {
		let self = this;
		self._themeDispose = self._bootstrap.themeService.onDidColorThemeChange((event: IColorTheme) => {
			self.updateTheme(event);
		});
	}

	ngAfterContentInit() {
		this.updateTheme(this._bootstrap.themeService.getColorTheme());
		this.loadWidget();
		this._changeref.detectChanges();
		this._actionbar = new ActionBar(this._actionbarRef.nativeElement);
		if (this._actions) {
			this._actionbar.push(this._bootstrap.instantiationService.createInstance(ToggleMoreWidgetAction, this._actions, this._component.actionsContext), { icon: true, label: false });
		}
		this.layout();
	}

	ngOnDestroy() {
		this._themeDispose.dispose();
	}

	public refresh(): void {
		if (this._component && this._component.refresh) {
			this._component.refresh();
		}
	}

	public layout(): void {
		if (this._component && this._component.layout) {
			this._component.layout();
		}
	}

	public get id(): string {
		return this._config.id;
	}

	public enableEdit(): void {
		this._actionbar.push(this._bootstrap.instantiationService.createInstance(DeleteWidgetAction, this._config.id, this._bootstrap.getUnderlyingUri()), { icon: true, label: false });
	}

	public disableEdit(): void {
		this._actionbar.pull(this._actionbar.length() - 1);
	}

	private loadWidget(): void {
		if (Object.keys(this._config.widget).length !== 1) {
			error('Exactly 1 widget must be defined per space');
			return;
		}
		let key = Object.keys(this._config.widget)[0];
		let selector = this.getOrCreateSelector(key);
		if (selector === undefined) {
			error('Could not find selector', key);
			return;
		}

		let componentFactory = this._componentFactoryResolver.resolveComponentFactory(selector);

		let viewContainerRef = this.componentHost.viewContainerRef;
		viewContainerRef.clear();

		let injector = ReflectiveInjector.resolveAndCreate([{ provide: WIDGET_CONFIG, useValue: this._config }], this._injector);
		let componentRef: ComponentRef<IDashboardWidget>;
		try {
			componentRef = viewContainerRef.createComponent(componentFactory, 0, injector);
			this._component = componentRef.instance;
			let actions = componentRef.instance.actions;
			if (componentRef.instance.refresh) {
				actions.push(new RefreshWidgetAction(componentRef.instance.refresh, componentRef.instance));
			}
			if (actions !== undefined && actions.length > 0) {
				this._actions = actions;
				this._changeref.detectChanges();
			}
		} catch (e) {
			error('Error rendering widget', key, e);
			return;
		}
		let el = <HTMLElement>componentRef.location.nativeElement;

		// set widget styles to conform to its box
		el.style.overflow = 'hidden';
		el.style.flex = '1 1 auto';
		el.style.position = 'relative';
	}

	/**
	 * Attempts to get the selector for a given key, and if none is defined tries
	 * to load it from the widget registry and configure as needed
	 *
	 * @private
	 * @param {string} key
	 * @returns {Type<IDashboardWidget>}
	 * @memberof DashboardWidgetWrapper
	 */
	private getOrCreateSelector(key: string): Type<IDashboardWidget> {
		let selector = componentMap[key];
		if (selector === undefined) {
			// Load the widget from the registry
			let widgetRegistry = <IInsightRegistry>Registry.as(Extensions.InsightContribution);
			let insightConfig = widgetRegistry.getRegisteredExtensionInsights(key);
			if (insightConfig === undefined) {
				return undefined;
			}
			// Save the widget for future use
			selector = componentMap['insights-widget'];
			delete this._config.widget[key];
			this._config.widget['insights-widget'] = insightConfig;
		}
		return selector;
	}

	private updateTheme(theme: IColorTheme): void {
		let el = <HTMLElement>this._ref.nativeElement;
		let headerEl: HTMLElement = this.header.nativeElement;
		let borderColor = theme.getColor(themeColors.SIDE_BAR_BACKGROUND, true);
		let backgroundColor = theme.getColor(colors.editorBackground, true);
		let foregroundColor = theme.getColor(themeColors.SIDE_BAR_FOREGROUND, true);
		let border = theme.getColor(colors.contrastBorder, true);

		if (this._config.background_color) {
			backgroundColor = theme.getColor(this._config.background_color);
		}

		if (this._config.border === 'none') {
			borderColor = undefined;
		}

		if (backgroundColor) {
			el.style.backgroundColor = backgroundColor.toString();
		}

		if (foregroundColor) {
			el.style.color = foregroundColor.toString();
		}

		let borderString = undefined;
		if (border) {
			borderString = border.toString();
			el.style.borderColor = borderString;
			el.style.borderWidth = '1px';
			el.style.borderStyle = 'solid';
		} else if (borderColor) {
			borderString = borderColor.toString();
			el.style.border = '3px solid ' + borderColor.toString();
		} else {
			el.style.border = 'none';
		}

		if (borderString) {
			headerEl.style.backgroundColor = borderString;
		} else {
			headerEl.style.backgroundColor = '';
		}

		if (this._config.fontSize) {
			headerEl.style.fontSize = this._config.fontSize;
		}
		if (this._config.fontWeight) {
			headerEl.style.fontWeight = this._config.fontWeight;
		}
		if (this._config.padding) {
			headerEl.style.padding = this._config.padding;
		}
	}
}