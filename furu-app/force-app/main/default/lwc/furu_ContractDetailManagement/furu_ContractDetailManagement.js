import {
    LightningElement,
    api,
    track,
    wire
} from 'lwc';
import {
    getRecordUi,
    generateRecordInputForUpdate,
    updateRecord
} from 'lightning/uiRecordApi';
import {
    NavigationMixin
} from 'lightning/navigation';
import {
    ShowToastEvent
} from 'lightning/platformShowToastEvent';
import CONTRACT_OBJECT from '@salesforce/schema/Contract';
import SDATE_FIELD from '@salesforce/schema/Contract.StartDate';
import EDATE_FIELD from '@salesforce/schema/Contract.EndDate';
import VALUE_FIELD from '@salesforce/schema/Contract.ContractValue__c';
import DES_FIELD from '@salesforce/schema/Contract.Description';

import MONTH1_FIELD from '@salesforce/schema/Contract.January__c';
import MONTH2_FIELD from '@salesforce/schema/Contract.February__c';
import MONTH3_FIELD from '@salesforce/schema/Contract.March__c';
import MONTH4_FIELD from '@salesforce/schema/Contract.April__c';
import MONTH5_FIELD from '@salesforce/schema/Contract.May__c';
import MONTH6_FIELD from '@salesforce/schema/Contract.June__c';
import MONTH7_FIELD from '@salesforce/schema/Contract.July__c';
import MONTH8_FIELD from '@salesforce/schema/Contract.August__c';
import MONTH9_FIELD from '@salesforce/schema/Contract.September__c';
import MONTH10_FIELD from '@salesforce/schema/Contract.October__c';
import MONTH11_FIELD from '@salesforce/schema/Contract.November__c';
import MONTH12_FIELD from '@salesforce/schema/Contract.December__c';

import EXRATEM1_FIELD from '@salesforce/schema/Contract.ExRateM1__c';
import EXRATEM2_FIELD from '@salesforce/schema/Contract.ExRateM2__c';
import EXRATEM3_FIELD from '@salesforce/schema/Contract.ExRateM3__c';
import EXRATEM4_FIELD from '@salesforce/schema/Contract.ExRateM4__c';
import EXRATEM5_FIELD from '@salesforce/schema/Contract.ExRateM5__c';
import EXRATEM6_FIELD from '@salesforce/schema/Contract.ExRateM6__c';
import EXRATEM7_FIELD from '@salesforce/schema/Contract.ExRateM7__c';
import EXRATEM8_FIELD from '@salesforce/schema/Contract.ExRateM8__c';
import EXRATEM9_FIELD from '@salesforce/schema/Contract.ExRateM9__c';
import EXRATEM10_FIELD from '@salesforce/schema/Contract.ExRateM10__c';
import EXRATEM11_FIELD from '@salesforce/schema/Contract.ExRateM11__c';
import EXRATEM12_FIELD from '@salesforce/schema/Contract.ExRateM12__c';

import errorMesSubmit from '@salesforce/label/c.furu_ContractDetailFormError';
import exchangeRate from '@salesforce/label/c.furu_ContractDetailFormExchangeRate';
import templateDescription from '@salesforce/label/c.furu_ContractTemplateDescription';
export default class Furu_ContractDetailManagement extends NavigationMixin(LightningElement) {
    @api recordId;
    @track listRows = [];
    listRowsId = [];
    ALL_MONTH = [MONTH1_FIELD, MONTH2_FIELD, MONTH3_FIELD, MONTH4_FIELD, MONTH5_FIELD, MONTH6_FIELD, MONTH7_FIELD, MONTH8_FIELD, MONTH9_FIELD, MONTH10_FIELD, MONTH11_FIELD, MONTH12_FIELD];
    EXRATE_MONTH = [EXRATEM1_FIELD, EXRATEM2_FIELD, EXRATEM3_FIELD, EXRATEM4_FIELD, EXRATEM5_FIELD, EXRATEM6_FIELD, EXRATEM7_FIELD, EXRATEM8_FIELD, EXRATEM9_FIELD, EXRATEM10_FIELD, EXRATEM11_FIELD, EXRATEM12_FIELD];
    OP_FIELDS = [SDATE_FIELD, EDATE_FIELD, VALUE_FIELD, DES_FIELD, ...this.ALL_MONTH, ...this.EXRATE_MONTH];
    objectInfo = {};
    label = {
        errorMesSubmit,
        exchangeRate,
        monthInput: 'Month',
        valueInput: 'Value',
        exrateInput: 'Exchange Rate',
    };
    optionsMonth = [];
    contractRecord = null;
    MAX_VALUE = 0;
    MIN_MONTH;
    MAX_MONTH;
    YEAR;
    isLoaded = false;
    isSaving = false;
    isTouchFirstError = false;
    isOldRow;
    @wire(getRecordUi, {
        recordIds: '$recordId',
        modes: 'Edit',
        layoutTypes: 'Full',
        optionalFields: '$OP_FIELDS'
    })
    wiredGetRecordUi({
        error,
        data
    }) {
        if (data) {
            //If there are some error close quick action
            this.getGlobalValuesAndCheckConstraints(data);
            //Get optionsMonth
            for (let i = this.MIN_MONTH; i <= this.MAX_MONTH; i++) {
                const fieldApiName = this.ALL_MONTH[i - 1].fieldApiName;
                const labelMonth = this.objectInfo.fields[fieldApiName].label;
                const option = {
                    label: labelMonth,
                    value: '' + i,
                }
                this.optionsMonth = [...this.optionsMonth, option];
            }
            //Check already month value
            let isNewContract = true;
            this.ALL_MONTH.forEach((month, index) => {
                let monthValue = index + 1;
                let exrateValue = this.contractRecord.fields[this.EXRATE_MONTH[index].fieldApiName].value;
                let valueValue = this.contractRecord.fields[month.fieldApiName].value;
                if (monthValue <= this.MAX_MONTH && monthValue >= this.MIN_MONTH) {
                    if (valueValue) {
                        this.pushValue(monthValue + '', valueValue, exrateValue); 
                        isNewContract = false;
                    } 
                }

            });
            //If contract is new
            if (isNewContract) {
                this.createNewRow();
            }
        } else if (error) {
            console.log(error);
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'There are something wrong. Please refresh this page',
                    message: error.body.message,
                    variant: 'error'
                })
            );
        }
    }
    connectedCallback() { }
    renderedCallback() {
        this.isLoaded = true;
    }
    createNewRow() {
        this.pushValue();
    }
    pushValue(monthValue, valueValue, exrateValue) {
        const isMaxRow = (this.listRows.length == (this.MAX_MONTH - this.MIN_MONTH)) ? true : false;
        const rowId = this.getUniqueId(this.listRowsId);
        this.listRowsId.push(rowId);
        this.listRows.push({
            id: rowId,
            isMaxRow: isMaxRow,
            fields: [{
                class: 'input-field input-combobox',
                name: this.label.monthInput + rowId,
                label: this.label.monthInput,
                required: true,
                value: monthValue || null,
                isCombobox: true,
                size: 4,
            },
            {
                class: 'input-field input-number-monthValue',
                name: this.label.valueInput + rowId,
                label: this.label.valueInput,
                required: true,
                value: valueValue || null,
                isInputNumber: true,
                step: 1,
                size: 4,
            },
            {
                class: 'input-field input-number-exrateValue',
                name: this.label.exrateInput + rowId,
                label: this.label.exrateInput,
                required: true,
                value: exrateValue || null,
                isInputNumber: true,
                step: 0.01,
                size: 4,
            },
            ],
        });
    }
    removeRow(event) {
        const rowId = event.target.dataset.rowid;
        if (rowId) {
            this.listRows = this.listRows.filter(row => row.id != rowId);
            this.listRows[this.listRows.length - 1].isMaxRow = false;
        }
    }
    validateInput(selectorString) {
        const allValid = [...this.template.querySelectorAll(selectorString)]
            .reduce((validSoFar, inputCmp) => {
                const isError = !inputCmp.reportValidity();
                if (isError) {
                    this.isTouchFirstError = true;
                }
                if (this.isTouchFirstError) {
                    const rowId = inputCmp.dataset.rowid;
                    if (isError) {
                        this.changeBorderStateListItem(rowId, isError);
                        this.isOldRow = rowId;
                    } else {
                        if (rowId != this.isOldRow)
                            this.changeBorderStateListItem(rowId, isError);
                    }
                }
                return validSoFar && inputCmp.checkValidity();
            }, true);
        return allValid;
    }
    handleCancel() {
        this.dispatchEvent(new CustomEvent('closeQA'));
    }
    handleSaveRecord() {
        this.isSaving = true;
        if (this.validateInput('.input-field') && !this.checkRowDuplicated()) {
            const totalValue = [...this.template.querySelectorAll('.input-field.input-number-monthValue')]
                .reduce((currentValue, inputCmp) => {
                    return currentValue + Number.parseInt(inputCmp.value);
                }, 0);
            if ((totalValue <= this.MAX_VALUE)) {
                this.errorMessage = null;
                let recordUpdate = this.getRecordInputForUpdate(); //
                //Reset 12 month value to null
                this.ALL_MONTH.forEach((month) => {
                    recordUpdate.fields[month.fieldApiName] = null;
                });
                //Update month's value
                this.listRows.forEach(row => {
                    const selectorString = '.input-field[data-rowid="' + row.id + '"]';
                    const comboboxCmp = this.template.querySelector('.input-combobox' + selectorString);
                    const inputNumberMonthValueCmp = this.template.querySelector('.input-number-monthValue' + selectorString);
                    const inputNumberExrateValueCmp = this.template.querySelector('.input-number-exrateValue' + selectorString);
                    const fieldMonthApiName = this.ALL_MONTH[comboboxCmp.value - 1].fieldApiName;
                    const fieldExrateApiName = this.EXRATE_MONTH[comboboxCmp.value - 1].fieldApiName;
                    const curValue = Number.parseInt(inputNumberMonthValueCmp.value);
                    const preMonthValue = recordUpdate.fields[fieldMonthApiName];
                    let updateExrateValue = Number.parseFloat(inputNumberExrateValueCmp.value);
                    let updateMonthValue = preMonthValue ? Number.parseInt(preMonthValue) + curValue : curValue;
                    updateMonthValue = updateMonthValue == 0 ? null : updateMonthValue;
                    recordUpdate.fields[fieldMonthApiName] = updateMonthValue;
                    recordUpdate.fields[fieldExrateApiName] = updateExrateValue;
                });
                //Format description
                recordUpdate.fields[DES_FIELD.fieldApiName] = this.updateDescriptionField(recordUpdate);
                updateRecord(recordUpdate)
                    .then(() => {
                        this.isSaving = false;
                        this.handleCancel();
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'Success',
                                message: 'Contract updated successfully',
                                variant: 'success'
                            })
                        );
                    })
            } else {
                this.isTouchFirstError = true;
                this.isSaving = false;
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: this.label.errorMesSubmit,
                        variant: 'error'
                    })
                );
            }
        }
        else if (this.checkRowDuplicated()) {
            this.getRowDuplicated().forEach(rowId => {
                this.changeBorderStateListItem(rowId, true);
                this.changeBorderStateListItemCombobox(rowId);
            });

            this.isTouchFirstError = true;
            this.isSaving = false;
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Duplicate Month',
                    variant: 'error'
                })
            );
        }
        else {
            this.isSaving = false;
        }
    }
    handleBlurInput(event) {
        const rowId = event.target.dataset.rowid;
        if (this.isTouchFirstError) {
            let isError = !this.validateInput('.input-field[data-rowid="' + rowId + '"]');
            if (this.getRowDuplicated().includes(rowId)) isError = true;
            this.changeBorderStateListItem(rowId, isError);
        }
    }
    getRecordInputForUpdate() {
        if (!(this.contractRecord && this.objectInfo)) {
            return undefined;
        }
        const recordInput = generateRecordInputForUpdate(
            this.contractRecord,
            this.objectInfo
        );
        return recordInput;
    }
    getUniqueId(arrayIds) {
        let letters = '0123456789ABCDEF';
        let id = '#';
        for (let i = 0; i < 6; i++) {
            id += letters[Math.floor(Math.random() * 16)];
        }
        if (!arrayIds.includes(id)) {
            return id;
        }
        return getUniqueId(arrayIds);
    }
    changeBorderStateListItem(rowId, isError) {
        const selectorString = 'li.slds-item[data-rowid="' + rowId + '"]';
        let element = this.template.querySelector(selectorString);
        if (element) {
            const changeClassName = isError ? 'slds-item borderError' : 'slds-item';
            element.className = changeClassName;
        }
    }
    changeBorderStateListItemCombobox(rowId) {
        const selectorString = '.input-field[data-rowid="' + rowId + '"]';
        let input_cpmbobox = this.template.querySelector('.input-combobox' + selectorString);
        if (input_cpmbobox) {
            input_cpmbobox.className = 'input-field input-combobox slds-has-error';
        }

    }
    formatIncome(monthValue, exRateValue) {
        return monthValue * exRateValue + ' VND';
    }
    updateDescriptionField(recordUpdate) {
        let description = '';
        this.ALL_MONTH.forEach((month, index) => {
            const monthValue = recordUpdate.fields[month.fieldApiName];
            const exRateValue = recordUpdate.fields[this.EXRATE_MONTH[index].fieldApiName];
            if (monthValue) {
                description += this.formatDescription(index + 1, monthValue, exRateValue);
                description += '\n';
            }
        });
        return description;
    }
    formatDescription(month, monthValue, exRateValue) {
        //month [1-12]
        let dayString2;
        if (month == 12) {
            dayString2 = this.formatLocaleString(this.YEAR + 1, 0, 31);
        }
        else {
            let daysInMonth = this.daysInMonth(month, this.YEAR); // Caculate last days In Next Month
            dayString2 = this.formatLocaleString(this.YEAR, month, daysInMonth);
        }
        const dayString1 = month + '/' + this.YEAR;
        return this.convertTemplate(templateDescription, dayString1, this.formatIncome(monthValue, exRateValue), dayString2);
    }
    getGlobalValuesAndCheckConstraints(data) {
        this.objectInfo = data.objectInfos[CONTRACT_OBJECT.objectApiName];
        this.contractRecord = data.records[this.recordId];
        const startDate = new Date(this.contractRecord.fields.StartDate.value);
        const endDate = new Date(this.contractRecord.fields.EndDate.value);
        if (!this.contractRecord || !this.objectInfo) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Something wrong',
                    variant: 'error'
                })
            );
            this.handleCancel();
        }
        if (!this.contractRecord.fields.ContractValue__c.value) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Empty contract Value',
                    message: 'Please insert contract Value',
                    variant: 'error'
                })
            );
            this.handleCancel();
        }
        else {
            this.MAX_VALUE = this.contractRecord.fields.ContractValue__c.value;
        }
        if (startDate.getFullYear() != endDate.getFullYear()) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error year contract',
                    message: 'Year of start date and end date must be equal',
                    variant: 'error'
                })
            );
            this.handleCancel();
        }
        else {
            this.MIN_MONTH = startDate.getMonth() + 1;
            this.MAX_MONTH = endDate.getMonth() + 1;
            this.YEAR = endDate.getFullYear();
        }
    }
    daysInMonth(iMonth, iYear) {
        return 32 - new Date(iYear, iMonth, 32).getDate();
    }
    errorCallback(error, stack) {
        console.log(error);
    }
    formatLocaleString(year, month, date) {
        const event = new Date(year, month, date);
        return event.toLocaleDateString();
    }
    convertTemplate(stringToFormat, ...formattingArguments) {
        if (typeof stringToFormat !== 'string') {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Template error',
                    message: 'There are something wrong! Please contact with your administration for more information.',
                    variant: 'error'
                })
            );
            this.handleCancel();
            return;
        }
        return stringToFormat.replace(/{(\d+)}/gm, (match, index) =>
            (formattingArguments[index] === undefined ? '' : `${formattingArguments[index]}`)
        );
    }

    checkRowDuplicated() {
        let comboboxCmps = this.template.querySelectorAll('.input-combobox');
        let monthIndexs = new Set();
        comboboxCmps.forEach(row => {
            monthIndexs.add(row.value);
        });
        return (comboboxCmps.length > monthIndexs.size) ? true : false;
    }

    getRowDuplicated() {
        const comboboxCmps = this.template.querySelectorAll('.input-combobox');
        let monthIndexs = new Set();
        let monthIndexsCheck = new Set();
        let rowErrorValues = new Set();
        let listDuplicate = [];
        comboboxCmps.forEach(row => {
            if (monthIndexs.add(row.value).size == monthIndexsCheck.size) {
                rowErrorValues.add(row.value);
            } else {
                monthIndexs.add(row.value);
                monthIndexsCheck.add(row.value);
            }
        });
        comboboxCmps.forEach(row => {
            if (rowErrorValues.has(row.value)) {
                listDuplicate.push(row.dataset.rowid);
            }
        });
        return listDuplicate;
    }
}