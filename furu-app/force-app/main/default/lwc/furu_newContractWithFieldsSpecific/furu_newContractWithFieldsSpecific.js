import { LightningElement, track, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';

import templateDescription from '@salesforce/label/c.furu_ContractTemplateDescription';
import USER_ID from '@salesforce/user/Id'
import NAME_FIELD from '@salesforce/schema/User.Name';
import CONTRACT_OBJECT from '@salesforce/schema/Contract';

export default class RecordFormCreateExample extends LightningElement {
    isSaving = false;
    YEAR;
    TERM;
    START_DATE;
    CONTRACT_INFO;
    listRowsId = [];
    monthOptions = [];
    dataToUpdateDescription = [];

    @track listRows = [];
    @track username;

    @wire(getRecord, { recordId: USER_ID, fields: [NAME_FIELD] })
    getUserCurrent({ error, data }) {
        if (data) {
            this.username = data.fields.Name.value;
        } else if (error) {
            console.log(error);
        }
    }
    @wire(getObjectInfo, { objectApiName: CONTRACT_OBJECT })
    getContractInfo({ data, error }) {
        if (data) {
            this.CONTRACT_INFO = data;
        } else if (error) {
            console.log(error);
        }
    };

    get ownerName() {
        return this.OWNERCONTRACT_FIELD;
    }

    connectedCallback() {
        this.createNewRow();
    }
    handleSubmit(event) {
        event.preventDefault();
        const fields = event.detail.fields;
        this.isSaving = true;
        if (this.validateContractDetail() && this.validateStatusValue(fields['Status'])) {
            if (!this.validateExceedTotalValue(Number.parseInt(fields['ContractValue__c']))) {
                this.isSaving = false;
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: 'Exceed Contract Value .',
                        variant: 'error'
                    })
                );
            } else {
                const dataContractDetails = this.getDataContractDetails();
                dataContractDetails.forEach(data => {
                    fields[data.monthApiName] = data.monthValue;
                    fields[data.exrateApiName] = data.exrateValue;
                });
                const contractDetailsFormated = this.formatDataContractDetails();
                fields['Description'] = this.updateDescriptionField(contractDetailsFormated);
                this.template.querySelector('lightning-record-edit-form').submit(fields);
            }
        } else {
            this.isSaving = false;
        }
    }
    handleSuccess() {
        this.isSaving = false;
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: 'Contract updated successfully',
                variant: 'success'
            })
        );
    }
    getDataContractDetails() {
        const listApiName = Object.keys(this.CONTRACT_INFO.fields);
        const contractDetailsFormated = this.formatDataContractDetails();
        const apiNames = this.getMonthsApiName(listApiName);
        const dataContractDetails = [];
        contractDetailsFormated.forEach(month => {
            dataContractDetails.push({
                monthValue: month.value,
                monthApiName: apiNames.monthsApiName[(month.index % 12)].apiName,
                exrateValue: month.exrate,
                exrateApiName: apiNames.exratesApiName[(month.index % 12)].apiName
            })
        });
        return dataContractDetails;
    }
    getMonthsApiName(listApiName) {
        const months = [
            'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'
        ]
        let exratesApiName = [];
        let monthsApiName = [];
        listApiName.forEach(apiName => {
            if (apiName.includes('ExRate')) {
                exratesApiName.push({ index: Number.parseInt(apiName.replace('ExRateM', '').replace('__c', '')) - 1, apiName: apiName });
            }
            months.forEach(month => {
                if (apiName.toLowerCase().includes(month)) {
                    monthsApiName.push({ index: months.indexOf(month), apiName: apiName });
                }
            });
        });
        return {
            exratesApiName: exratesApiName.sort((a, b) => a.index - b.index),
            monthsApiName: monthsApiName.sort((a, b) => a.index - b.index)
        }
    }
    formatDataContractDetails() {
        let data = [];
        this.listRows.forEach(row => {
            const selectorString = '.input-field[data-rowid="' + row.id + '"]';
            const monthIndexCmp = this.template.querySelector('.input-combobox' + selectorString);
            const monthValueCmp = this.template.querySelector('.input-number-monthValue' + selectorString);
            const monthExrateCmp = this.template.querySelector('.input-number-exrateValue' + selectorString);
            if (monthIndexCmp && monthValueCmp && monthExrateCmp) {
                if (monthIndexCmp.value && monthValueCmp.value && monthExrateCmp.value) {
                    const monthIndex = Number.parseInt(monthIndexCmp.value);
                    if (monthIndex < new Date(this.START_DATE).getMonth())
                        monthIndex += 12;
                    const monthValue = Number.parseInt(monthValueCmp.value);
                    const monthExrate = Number.parseFloat(monthExrateCmp.value);
                    const contractDetail = { index: monthIndex, value: monthValue, exrate: monthExrate };
                    data.push(contractDetail);
                }
            }
        });
        data.sort((a, b) => a.index - b.index);
        return data;
    }
    handleChangeTerm(event) {
        this.TERM = event.target.value;
        if (this.START_DATE && this.TERM) {
            this.monthOptions = this.setMonthOption();
        }
    }
    handleChangeStartDate(event) {
        this.START_DATE = event.target.value;
        this.YEAR = new Date(this.START_DATE).getFullYear();
        if (this.START_DATE && this.TERM) {
            this.monthOptions = this.setMonthOption();
        }
    }
    validateStatusValue(statusValue) {
        return (statusValue !== 'Draft') ? false : true ;
    }
    validateContractDetail() {
        let currentRowid = '';
        let indexFlag = 1;
        let asynronus;
        let listIdError = new Set();
        this.template.querySelectorAll('.input-field').forEach(inputCmp => {
            if (inputCmp.dataset.rowid !== currentRowid) {
                asynronus = (inputCmp.value) ? true : false;
                currentRowid = inputCmp.dataset.rowid;
                indexFlag = 1;
            } else {
                let flag = (inputCmp.value) ? true : false;
                if (flag !== asynronus) {
                    listIdError.add(inputCmp.dataset.rowid);
                    this.changeBorderStateListItem(inputCmp.dataset.rowid, true);
                } else {
                    indexFlag++;
                }
            }
            if (indexFlag === 3) {
                this.changeBorderStateListItem(inputCmp.dataset.rowid, false);
            }
        });
        this.template.querySelectorAll('.input-field').forEach(cmp => {
            cmp.setCustomValidity('');
            if (listIdError.has(cmp.dataset.rowid)) {
                if (!cmp.value) {
                    cmp.setCustomValidity('Complete this field .');
                }
            }
            cmp.reportValidity();
        });
        return (listIdError.size > 0) ? false : true;
    }
    validateExceedTotalValue(maxValue) {
        const totalValue = [...this.template.querySelectorAll('.input-field.input-number-monthValue')]
            .reduce((currentValue, inputCmp) => {
                return (inputCmp.value) ? currentValue + Number.parseInt(inputCmp.value) : currentValue;
            }, 0);
        return (totalValue <= maxValue) ? true : false;
    }
    setMonthOption() {
        let options = [];
        const monthStringOptions = [
            'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const term = Number.parseInt(this.TERM);
        const startDate = new Date(this.START_DATE);
        let minMonth = startDate.getMonth();
        let maxMonth = (startDate.getDate() === 1 && this.TERM < 12) ? minMonth + term : minMonth + term + 1;
        if (term === 12)
            maxMonth = minMonth + 12;
        for (let i = minMonth; i < maxMonth; i++) {
            options.push({ value: i.toString(), label: monthStringOptions[i % 12] });
        }
        return options;
    }
    changeBorderStateListItem(rowId, isError) {
        const selectorString = 'li.slds-item[data-rowid="' + rowId + '"]';
        let element = this.template.querySelector(selectorString);
        if (element) {
            const styleString = isError ? '1px solid red' : '1px solid #dcdde1';
            element.style.border = styleString;
        }
    }
    removeRow(event) {
        const rowId = event.target.dataset.rowid;
        if (rowId) {
            this.listRowsId.splice(this.listRowsId.indexOf(rowId), 1);
            this.listRows = this.listRows.filter(row => row.id != rowId);
        }
    }
    handleCancel() {
        this.dispatchEvent(new CustomEvent('closeQA'));
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
    createNewRow() {
        this.pushValue();
    }
    pushValue() {
        const rowId = this.getUniqueId(this.listRowsId);
        this.listRowsId.push(rowId);
        this.listRows.push({
            id: rowId,
            fields: [{
                option: [],
                class: 'input-field  input-combobox',
                name: 'Month' + rowId,
                label: 'Month',
                required: false,
                value: null,
                isCombobox: true,
                size: 4,
            },
            {
                class: 'input-field  input-number-monthValue',
                name: 'Value' + rowId,
                label: 'Value',
                required: false,
                value: null,
                isInputNumber: true,
                step: 1,
                size: 4,
            },
            {
                class: 'input-field  input-number-exrateValue',
                name: 'Exrate' + rowId,
                label: 'Exrate',
                required: false,
                value: null,
                isInputNumber: true,
                step: 0.01,
                size: 4,
            },
            ],
        });
    }
    handleMonthOptions(event) {
        let monthExistings = [];
        this.template.querySelectorAll('.input-field.input-combobox').forEach(cmp => {
            if (cmp.value && cmp.value !== event.target.value) {
                monthExistings.push(cmp.value);
            }
        });
        let options = this.monthOptions.filter(month => {
            if (!monthExistings.includes(month.value))
                return month;
        });
        this.listRows.forEach(row => {
            if (row.id === event.target.dataset.rowid) {
                row.fields[0].option = options;
            }
        });
    }
    formatIncome(monthValue, exRateValue) {
        return monthValue * exRateValue + ' VND';
    }
    updateDescriptionField(dataToUpdateDescription) {
        let description = '';
        dataToUpdateDescription.forEach((month) => {
            description += this.formatDescription((month.index % 12) + 1, month.value, month.exrate);
            description += '\n';
            if (month.index === 11)
                this.YEAR++;
        });
        return description;
    }
    formatDescription(month, monthValue, exRateValue) {
        let daysInMonth = this.daysInMonth(month, this.YEAR);
        let dayString2 = this.formatLocaleString(this.YEAR, month, daysInMonth);
        const dayString1 = month + '/' + this.YEAR;
        return this.convertTemplate(templateDescription, dayString1, this.formatIncome(monthValue, exRateValue), dayString2);
    }
    formatLocaleString(year, month, date) {
        const event = new Date(year, month - 1, date);
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
            return;
        }
        let reval = stringToFormat.replace(/{(\d+)}/gm, (match, index) =>
            (formattingArguments[index] === undefined ? '' : `${formattingArguments[index]}`)
        );
        return reval;
    }
    daysInMonth(iMonth, iYear) {
        return new Date(iYear, iMonth, 0).getDate();
    }
}