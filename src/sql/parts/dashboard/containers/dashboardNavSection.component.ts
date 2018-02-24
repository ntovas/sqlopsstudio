/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import 'vs/css!./dashboardNavSection';

import { Component, Inject, Input, forwardRef, ViewChild, ElementRef, ViewChildren, QueryList, OnDestroy, ChangeDetectorRef, EventEmitter, OnChanges, AfterContentInit } from '@angular/core';

import { DashboardServiceInterface } from 'sql/parts/dashboard/services/dashboardServiceInterface.service';
import { WidgetConfig, TabConfig, NavSectionConfig } from 'sql/parts/dashboard/common/dashboardWidget';
import { PanelComponent, IPanelOptions, NavigationBarLayout } from 'sql/base/browser/ui/panel/panel.component';
import { TabComponent } from 'sql/base/browser/ui/panel/tab.component';
import { DashboardTab } from 'sql/parts/dashboard/common/interfaces';
import { error } from 'sql/base/common/log';
import { WIDGETS_CONTAINER } from 'sql/parts/dashboard/containers/dashboardWidgetContainer.contribution';
import { GRID_CONTAINER } from 'sql/parts/dashboard/containers/dashboardGridContainer.contribution';
import * as dashboardHelper from 'sql/parts/dashboard/common/dashboardHelper';

import { Registry } from 'vs/platform/registry/common/platform';
import Event, { Emitter } from 'vs/base/common/event';

@Component({
	selector: 'dashboard-nav-section',
	providers: [{ provide: DashboardTab, useExisting: forwardRef(() => DashboardNavSection) }],
	templateUrl: decodeURI(require.toUrl('sql/parts/dashboard/containers/dashboardNavSection.component.html'))
})
export class DashboardNavSection extends DashboardTab implements OnDestroy, OnChanges, AfterContentInit {
	@Input() private tab: TabConfig;
	protected tabs: Array<TabConfig> = [];
	private _onResize = new Emitter<void>();
	public readonly onResize: Event<void> = this._onResize.event;

	// tslint:disable-next-line:no-unused-variable
	private readonly panelOpt: IPanelOptions = {
		layout: NavigationBarLayout.vertical
	};

	// a set of config modifiers
	private readonly _configModifiers: Array<(item: Array<WidgetConfig>, dashboardServer: DashboardServiceInterface, context: string) => Array<WidgetConfig>> = [
		dashboardHelper.removeEmpty,
		dashboardHelper.initExtensionConfigs,
		dashboardHelper.addProvider,
		dashboardHelper.addEdition,
		dashboardHelper.addContext,
		dashboardHelper.filterConfigs
	];

	private readonly _gridModifiers: Array<(item: Array<WidgetConfig>, originalConfig: Array<WidgetConfig>) => Array<WidgetConfig>> = [
		dashboardHelper.validateGridConfig
	];

	@ViewChildren(DashboardTab) private _tabs: QueryList<DashboardTab>;
	@ViewChild(PanelComponent) private _panel: PanelComponent;
	constructor(
		@Inject(forwardRef(() => DashboardServiceInterface)) protected dashboardService: DashboardServiceInterface,
		@Inject(forwardRef(() => ChangeDetectorRef)) protected _cd: ChangeDetectorRef
	) {
		super();
	}

	ngOnChanges() {
		this.tabs = [];
		let navSectionContainers: NavSectionConfig[] = [];
		if (this.tab.container) {
			navSectionContainers = Object.values(this.tab.container)[0];
			this.loadNewTabs(navSectionContainers);
		}
	}

	ngAfterContentInit(): void {
		if (this._tabs) {
			this._tabs.forEach(tabContent => {
				this._register(tabContent.onResize(() => {
					this._onResize.fire();
				}));
			});
		}
	}

	ngOnDestroy() {
		this.dispose();
	}

	private loadNewTabs(dashboardTabs: NavSectionConfig[]) {
		if (dashboardTabs && dashboardTabs.length > 0) {
			let selectedTabs = dashboardTabs.map(v => {

				let container = dashboardHelper.getDashboardContainer(v.container);
				let key = Object.keys(container)[0];

				if (key === WIDGETS_CONTAINER || key === GRID_CONTAINER) {
					let configs = <WidgetConfig[]>Object.values(container)[0];
					this._configModifiers.forEach(cb => {
						configs = cb.apply(this, [configs, this.dashboardService, this.tab.context]);
					});
					this._gridModifiers.forEach(cb => {
						configs = cb.apply(this, [configs]);
					});
					if (key === WIDGETS_CONTAINER) {
						return { id: v.id, title: v.title, container: { 'widgets-container': configs } };

					} else {
						return { id: v.id, title: v.title, container: { 'grid-container': configs } };
					}
				}
				return { id: v.id, title: v.title, container: container };
			}).map(v => {
				let config = v as TabConfig;
				config.context = this.tab.context;
				config.editable = false;
				config.canClose = false;
				this.addNewTab(config);
				return config;
			});

			// put this immediately on the stack so that is ran *after* the tab is rendered
			setTimeout(() => {
				this._panel.selectTab(selectedTabs.pop().id);
			});
		}
	}

	private addNewTab(tab: TabConfig): void {
		let existedTab = this.tabs.find(i => i.id === tab.id);
		if (!existedTab) {
			this.tabs.push(tab);
			this._cd.detectChanges();
		}
	}

	private getContentType(tab: TabConfig): string {
		return tab.container ? Object.keys(tab.container)[0] : '';
	}

	public get id(): string {
		return this.tab.id;
	}

	public get editable(): boolean {
		return this.tab.editable;
	}

	public layout() {

	}

	public refresh(): void {
		if (this._tabs) {
			this._tabs.forEach(tabContent => {
				tabContent.refresh();
			});
		}
	}

	public enableEdit(): void {
		if (this._tabs) {
			this._tabs.forEach(tabContent => {
				tabContent.enableEdit();
			});
		}
	}

	public handleTabChange(tab: TabComponent): void {
		let localtab = this._tabs.find(i => i.id === tab.identifier);
		localtab.layout();
	}
}
