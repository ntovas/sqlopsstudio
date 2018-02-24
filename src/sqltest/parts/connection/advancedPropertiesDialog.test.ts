/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import { OptionsDialog } from 'sql/base/browser/ui/modal/optionsDialog';
import { AdvancedPropertiesController } from 'sql/parts/connection/connectionDialog/advancedPropertiesController';
import { Builder, $ } from 'vs/base/browser/builder';
import { ContextKeyServiceStub } from 'sqltest/stubs/contextKeyServiceStub';
import * as sqlops from 'sqlops';
import * as TypeMoq from 'typemoq';
import * as assert from 'assert';

suite('Advanced properties dialog tests', () => {
	var advancedController: AdvancedPropertiesController;
	var providerOptions: sqlops.ConnectionOption[];

	setup(() => {
		advancedController = new AdvancedPropertiesController(() => { }, null);
		providerOptions = [
			{
				name: 'a1',
				displayName: undefined,
				description: undefined,
				groupName: 'a',
				categoryValues: undefined,
				defaultValue: undefined,
				isIdentity: true,
				isRequired: true,
				specialValueType: null,
				valueType: 0
			},
			{
				name: 'b1',
				displayName: undefined,
				description: undefined,
				groupName: 'b',
				categoryValues: undefined,
				defaultValue: undefined,
				isIdentity: true,
				isRequired: true,
				specialValueType: null,
				valueType: 0
			},
			{
				name: 'noType',
				displayName: undefined,
				description: undefined,
				groupName: undefined,
				categoryValues: undefined,
				defaultValue: undefined,
				isIdentity: true,
				isRequired: true,
				specialValueType: null,
				valueType: 0
			},
			{
				name: 'a2',
				displayName: undefined,
				description: undefined,
				groupName: 'a',
				categoryValues: undefined,
				defaultValue: undefined,
				isIdentity: true,
				isRequired: true,
				specialValueType: null,
				valueType: 0
			},
			{
				name: 'b2',
				displayName: undefined,
				description: undefined,
				groupName: 'b',
				categoryValues: undefined,
				defaultValue: undefined,
				isIdentity: true,
				isRequired: true,
				specialValueType: null,
				valueType: 0
			}
		];
	});

	test('advanced dialog should open when showDialog in advancedController get called', () => {
		var isAdvancedDialogCalled = false;
		let options: { [name: string]: any } = {};
		let builder: Builder = $().div();
		let advanceDialog = TypeMoq.Mock.ofType(OptionsDialog, TypeMoq.MockBehavior.Strict,
			'', // title
			'', // name
			{}, // options
			undefined, // partsService
			undefined, // themeService
			undefined, // Context view service
			undefined, // telemetry service
			new ContextKeyServiceStub() // contextkeyservice
		);
		advanceDialog.setup(x => x.open(TypeMoq.It.isAny(), TypeMoq.It.isAny())).callback(() => {
			isAdvancedDialogCalled = true;
		});
		advancedController.advancedDialog = advanceDialog.object;
		advancedController.showDialog(providerOptions, builder.getHTMLElement(), options);
		assert.equal(isAdvancedDialogCalled, true);
	});
});