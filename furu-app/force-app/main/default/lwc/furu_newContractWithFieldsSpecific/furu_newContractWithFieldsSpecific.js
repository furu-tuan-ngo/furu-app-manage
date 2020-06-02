import {
    LightningElement,
    track,
    wire
} from 'lwc';
import {
    createRecord,
    getRecord
} from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import getAccounts from '@salesforce/apex/FURU_ContractManagermentController.getAccounts';
import getPriceBooks from '@salesforce/apex/FURU_ContractManagermentController.getPriceBooks';
import getStatusPicklistValues from '@salesforce/apex/FURU_ContractManagermentController.getStatusPicklistValues';
import templateDescription from '@salesforce/label/c.furu_ContractTemplateDescription';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import USER_ID from '@salesforce/user/Id'
import NAME_FIELD from '@salesforce/schema/User.Name';

import CONTRACT_OBJECT from '@salesforce/schema/Contract';

import ACCOUNTID_FIELD from '@salesforce/schema/Contract.AccountId';
import CUSTOMERSIGNEDDATE_FIELD from '@salesforce/schema/Contract.CustomerSignedDate';
import STARTDAY_FIELD from '@salesforce/schema/Contract.StartDate';
import CUSTOMERSIGNEDTITLE_FIELD from '@salesforce/schema/Contract.CustomerSignedTitle'
import CONTRACTTERM_FIFELD from '@salesforce/schema/Contract.ContractTerm';
import CONTRACTVALUE_FIELD from '@salesforce/schema/Contract.ContractValue__c';
import STATUS_FIELD from '@salesforce/schema/Contract.Status';
import SPECIALTERMS_FIELD from '@salesforce/schema/Contract.SpecialTerms';
import PRICEBOOK2ID_FIELD from '@salesforce/schema/Contract.Pricebook2Id';
import CONTRACTNUMBER_FIELD from '@salesforce/schema/Contract.ContractNumber__c';
import DES_FIELD from '@salesforce/schema/Contract.Description';


export default class RecordFormCreateExample extends LightningElement {
    isSaving = false;
    YEAR;
    CONTRACT_INFO;
    accountOption = [];
    pricesBookOption = [];
    pickListStatusOption = [];
    listRowsId = [];
    monthOptions = [];
    dataToUpdateDescription = [];

    @track searchString = '';
    @track listRows = [];
    @track username;
    @track LOOKUP_FIELDS = {
        Account: {
            isValue: false,
            Value: '',
            Id: ''
        },
        PriceBook: {
            isValue: false,
            Value: '',
            Id: ''
        }
    }

    @wire(getRecord, { recordId: USER_ID, fields: [NAME_FIELD] })
    getUserCurrent({ error, data }) {
        if (data) {
            this.username = data.fields.Name.value;
        } else if (error) {
            console.log(error);
        }
    }
    @wire(getAccounts, { searchString: '$searchString' })
    getAccounts({ data, error }) {
        if (data) {
            this.accountOption = data;
        } else if (error) {
            console.log(error);
        }
    }
    @wire(getPriceBooks, { searchString: '$searchString' })
    getPricesBooks({ data, error }) {
        if (data) {
            this.pricesBookOption = data;
        } else if (error) {
            console.log(error);
        }
    }
    @wire(getStatusPicklistValues)
    getPicklistStatusValues({ data, error }) {
        if (data) {
            for (let picklist in data) {
                this.pickListStatusOption = [...this.pickListStatusOption, { label: picklist, value: picklist }];
            }
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

    handleSaveRecord() {
        this.isSaving = true;
        console.log(this.CONTRACT_INFO);
        for(const item in this.CONTRACT_INFO.fields){
            console.log((item));
        }
        if (this.validateInput()) {
            if (!this.checkRowDuplicated()) {
                const contractValue = this.getComponent('[data-item="CONTRACTVALUE_FIELD"]');
                const totalValue = this.getComponents('input-number-monthValue')
                    .reduce((currentValue, inpCmp) => {
                        let valueCmp = (inpCmp.value) ? Number.parseInt(inpCmp.value) : 0;
                        return currentValue + valueCmp;
                    }, 0);

                if (totalValue <= Number.parseInt(contractValue.value)) {
                    const recordCreate = this.getRecordCreate();
                    console.log(recordCreate);
                    createRecord(recordCreate)
                        .then(() => {
                            this.isSaving = false;
                            this.dispatchEvent(
                                new ShowToastEvent({
                                    title: 'Success',
                                    message: 'Contract created successfully',
                                    variant: 'success'
                                })
                            );
                        })
                        .catch(error => {
                            console.log(error);
                        });
                }
                else {
                    this.isSaving = false;
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Error',
                            message: 'Exceed Contract Value',
                            variant: 'error'
                        })
                    );
                }
            } else {
                this.isSaving = false;
                let listIdError = this.getRowDuplicated();
                this.listRowsId.forEach(rowId => {
                    let isError = false;
                    if (listIdError.includes(rowId)) {
                        isError = true;
                    }
                    this.changeBorderStateListItem(rowId, isError);
                    this.changeBorderStateListItemCombobox(rowId);
                });
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: 'Duplicate Month',
                        variant: 'error'
                    })
                );
            }
        } else {
            console.log('error');
            this.isSaving = false;
        }

    }
    getRecordCreate() {
        const fields = {};
        const defaultFieldList = this.getComponents();
        const contractInfor = this.CONTRACT_INFO.fields;
        defaultFieldList.forEach(field => {
            if (field.name == 'STARTDAY_FIELD') {
                if (field.value) {
                    fields[contractInfor.StartDate.apiName] = field.value;
                    this.YEAR = new Date(field.value).getFullYear();
                }
            }
            fields[contractInfor.CustomerSignedDate.apiName] = (field.name == 'CUSTOMERSIGNEDDATE_FIELD' && field.value) ? field.value : fields[contractInfor.CustomerSignedDate.apiName];
            fields[contractInfor.CustomerSignedTitle.apiName] = (field.name == 'CUSTOMERSIGNEDTITLE_FIELD' && field.value) ? field.value : fields[contractInfor.CustomerSignedTitle.apiName];
            fields[contractInfor.ContractTerm.apiName] = (field.name == 'CONTRACTTERM_FIFELD' && field.value) ? field.value : fields[contractInfor.ContractTerm.apiName];
            fields[contractInfor.ContractValue__c.apiName] = (field.name == 'CONTRACTVALUE_FIELD' && field.value) ? field.value : fields[contractInfor.ContractValue__c.apiName];
            fields[contractInfor.Status.apiName] = (field.name == 'STATUS_FIELD' && field.value) ? field.value : fields[contractInfor.Status.apiName];
            fields[contractInfor.SpecialTerms.apiName] = (field.name == 'SPECIALTERMS_FIELD' && field.value) ? field.value : fields[contractInfor.SpecialTerms.apiName];
            fields[contractInfor.ContractNumber__c.apiName] = (field.name == 'CONTRACTNUMBER__c_FIELD' && field.value) ? field.value : fields[contractInfor.ContractNumber__c.apiName];
        });
        fields[contractInfor.AccountId.apiName] = this.LOOKUP_FIELDS.Account.Id;
        fields[contractInfor.Pricebook2Id.apiName] = this.LOOKUP_FIELDS.PriceBook.Id;
        // let descriptionDataList = [];
        // this.listRowsId.forEach(rowId => {
        //     const selectorString = ('.input-field.[data-rowid="' + rowId + '"]');
        //     const comboboxCmp = this.template.querySelector('.input-combobox' + selectorString);
        //     const monthValueCmp = this.template.querySelector('.input-number-monthValue' + selectorString);
        //     const exrateValueCmp = this.template.querySelector('.input-number-exrateValue' + selectorString);
        //     if (comboboxCmp.value && monthValueCmp.value && exrateValueCmp.value) {
        //         const index = Number.parseInt(comboboxCmp.value);
        //         const fieldMonthApiName = this.ALL_MONTH[index].fieldApiName;
        //         const fieldExrateApiName = this.EXRATE_MONTH[index].fieldApiName;
        //         const monthValue = monthValueCmp.value;
        //         const exrateValue = exrateValueCmp.value;
        //         fields[fieldMonthApiName] = monthValue;
        //         fields[fieldExrateApiName] = exrateValue;
        //         descriptionDataList.push({
        //             monthIndex: index + 1,
        //             monthValue: Number.parseFloat(monthValue),
        //             exrateValue: Number.parseFloat(exrateValue)
        //         });
        //     }
        // });
        // this.dataToUpdateDescription = [...this.formatDataToUpdateDescription(descriptionDataList)];
        // const recordCreate = { apiName: CONTRACT_OBJECT.objectApiName, fields };
        // recordCreate.fields[DES_FIELD.fieldApiName] = this.updateDescriptionField();
        const recordCreate = { apiName: CONTRACT_OBJECT.objectApiName, fields };
        return recordCreate;
    }
    changeBorderStateListItem(rowId, isError) {
        const selectorString = 'li.slds-item[data-rowid="' + rowId + '"]';
        let element = this.template.querySelector(selectorString);
        if (element) {
            const styleString = isError ? '1px solid red' : '1px solid #dcdde1';
            element.style.border = styleString;
        }
    }
    changeBorderStateListItemCombobox(rowId) {
        const selectorString = '.input-field[data-rowid="' + rowId + '"]';
        let input_cpmbobox = this.template.querySelector('.input-combobox' + selectorString);
        if (input_cpmbobox) {
            input_cpmbobox.className = 'input-field  input-combobox slds-has-error';
        }

    }
    getComponent(dataQuery) {
        return this.template.querySelector('.input-field' + dataQuery);
    }
    getComponents(dataQuery) {
        const selectorString = (dataQuery) ? '.input-field.' + dataQuery : '.input-field';
        const components = [...this.template.querySelectorAll(selectorString)];
        return components;
    }
    querySelectorAll(selectorString) {
        return this.template.querySelectorAll(selectorString);
    }
    formatDataToUpdateDescription(listData) {
        let returnDataList = [];
        const termCpm = this.template.querySelector('.input-field.default-field[data-term="termNumber"]');
        const startDateCmp = this.template.querySelector('.input-field.default-field[data-date="startDate"]');
        if (termCpm.value && startDateCmp.value) {
            const termNumber = Number.parseInt(termCpm.value);
            const dateStart = new Date(startDateCmp.value);
            const monthIndexMin = dateStart.getMonth();
            const monthIndexMax = (dateStart.getDate() == 1) ? dateStart.getMonth() + termNumber : dateStart.getMonth() + termNumber + 1;
            for (let i = monthIndexMin; i < monthIndexMax; i++) {
                listData.forEach((data) => {
                    if (data.monthIndex == (i + 1) % 12 || data.monthIndex == i + 1) {
                        returnDataList.push(data);
                    }
                });
            }
            return returnDataList;
        } else {
            return null;
        }

    }

    validateInput() {
        const requiredFieldList = [
            'ACCOUNTID_FIELD',
            'CONTRACTVALUE_FIELD',
            'STARTDAY_FIELD',
            'CONTRACTTERM_FIFELD'
        ];
        let allValid = this.getComponents()
            .reduce((validSoFar, inputCmp) => {
                // handle required fields
                if (requiredFieldList.includes(inputCmp.dataset.item)) {
                    if (inputCmp.value) {
                        inputCmp.setCustomValidity('');
                    } else {
                        inputCmp.setCustomValidity('Complete this field.');
                    }
                }
                //handle STATUS field 
                if (inputCmp.name === "STATUS_FIELD") {
                    if (inputCmp.value !== "Draft" && inputCmp.value) {
                        inputCmp.setCustomValidity("Choose a valid contract status and save your changes. Ask your admin for details.");
                    } else if (inputCmp.value) {
                        inputCmp.setCustomValidity("");
                    }
                }
                inputCmp.reportValidity();
                return validSoFar && inputCmp.checkValidity();
            }, true);
        console.log(allValid);
        let currentRowid = '';
        let indexFlag = 1;
        let asynronus;
        let listIdError = new Set();
        this.getComponents('input-detail').forEach(inputCmp => {
            //handle Contract detail
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
            console.log(currentRowid);

            if (indexFlag === 3) {
                this.changeBorderStateListItem(inputCmp.dataset.rowid, false);
            }
        });

        const Cmps = this.getComponents('input-detail');
        Cmps.forEach(cmp => {
            cmp.setCustomValidity('');
            if (listIdError.has(cmp.dataset.rowid)) {
                if (!cmp.value) {
                    cmp.setCustomValidity('Complete this field .');
                }
            }
            cmp.reportValidity();
        });

        allValid = (listIdError.size > 0) ? false : allValid;
        console.log(allValid, listIdError.size);
        return allValid;
    }
    removeRow(event) {
        const rowId = event.target.dataset.rowid;
        if (rowId) {
            this.listRowsId.splice(this.listRowsId.indexOf(rowId), 1);
            this.listRows = this.listRows.filter(row => row.id != rowId);
        }
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
                class: 'input-field  input-combobox input-detail',
                name: 'Month' + rowId,
                label: 'Month',
                required: false,
                value: null,
                isCombobox: true,
                size: 4,
            },
            {
                class: 'input-field  input-number-monthValue input-detail',
                name: 'Value' + rowId,
                label: 'Value',
                required: false,
                value: null,
                isInputNumber: true,
                step: 1,
                size: 4,
            },
            {
                class: 'input-field  input-number-exrateValue input-detail',
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
    checkRowDuplicated() {
        const comboboxCmps = this.getComponents('input-combobox');
        let comboboxCmpList = [];
        let monthIndexs = new Set();
        comboboxCmps.forEach(row => {
            if (row.value) {
                comboboxCmpList.push(row.value);
            }
        });
        comboboxCmpList.forEach(month => {
            monthIndexs.add(month);
        })
        return (comboboxCmpList.length > monthIndexs.size) ? true : false;
    }

    getRowDuplicated() {
        const comboboxCmps = this.template.querySelectorAll('.input-combobox');
        let comboboxCmpsHasValue = [];
        let monthIndexs = new Set();
        let monthIndexsCheck = new Set();
        let rowErrorValues = new Set();
        let listDuplicate = [];
        comboboxCmps.forEach(row => {
            if (row.value) comboboxCmpsHasValue.push(row.value);
        });
        comboboxCmpsHasValue.forEach(month => {
            if (monthIndexs.add(month).size == monthIndexsCheck.size) {
                rowErrorValues.add(month);
            } else {
                monthIndexs.add(month);
                monthIndexsCheck.add(month);
            }
        });
        comboboxCmps.forEach(row => {
            if (rowErrorValues.has(row.value)) {
                listDuplicate.push(row.dataset.rowid);
            }
        });
        return listDuplicate;
    }
    showDropdown(evt) {
        this.searchString = '';
        const selectorString = '.' + evt.target.name + '_dropdown';
        const dropdownCmp = this.template.querySelector(selectorString);
        if (dropdownCmp) {
            dropdownCmp.className = evt.target.name + '_dropdown slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click slds-is-open';
        }
    }
    handleChooseDropdownValue(event) {
        const selectorString = event.target.dataset.drname;
        let selectedField = {};
        selectedField.isValue = true;
        selectedField.Value = event.target.dataset.dpname;
        selectedField.Id = event.target.dataset.id;
        this.LOOKUP_FIELDS.Account = (selectorString == 'ACCOUNTID_FIELD') ? selectedField : this.LOOKUP_FIELDS.Account;
        this.LOOKUP_FIELDS.PriceBook = (selectorString == 'PRICEBOOK2ID_FIELD') ? selectedField : this.LOOKUP_FIELDS.PriceBook;
        let itemCmp = this.template.querySelector('.' + selectorString + '_dropdown');
        if (itemCmp) {
            itemCmp.className = selectorString + '_dropdown slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click';
        }
    }
    removeOptionSelected(event) {
        this.searchString = '';
        const selectorString = event.target.dataset.drname;
        let selectedField = {
            isValue: false,
            Value: '',
            Id: ''
        };
        this.LOOKUP_FIELDS.Account = (selectorString == 'ACCOUNTID_FIELD') ? selectedField : this.LOOKUP_FIELDS.Account;
        this.LOOKUP_FIELDS.PriceBook = (selectorString == 'PRICEBOOK2ID_FIELD') ? selectedField : this.LOOKUP_FIELDS.PriceBook;
        let selectedCmp = this.template.querySelector('.' + selectorString + '_dropdown');
        selectedCmp.className = selectorString + '_dropdown slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click slds-is-open';
        setTimeout(() => {
            const inputCmp = this.template.querySelector('.input-field.default-field[data-drname="' + selectorString + '"]');
            if (inputCmp) inputCmp.focus();
            this.searchString = '';
        }, 50);
    }
    handleSearchLookupField(event) {
        this.searchString = event.target.value;
    }
    handleMonthOptions() {
        const termCpm = this.template.querySelector('.input-field.default-field[data-item="CONTRACTTERM_FIFELD"]');
        const startDateCmp = this.template.querySelector('.input-field.default-field[data-item="STARTDAY_FIELD"]');
        if (termCpm.value && startDateCmp.value) {
            const termNumber = Number.parseInt(termCpm.value);
            const dateStart = new Date(startDateCmp.value);
            const months = [
                'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'Octerber', 'November', 'December'
            ]
            let monthOptions = [];
            const monthIndexMin = dateStart.getMonth();
            const monthIndexMax = (dateStart.getDate() == 1) ? dateStart.getMonth() + termNumber : dateStart.getMonth() + termNumber + 1;
            for (let i = monthIndexMin; i < monthIndexMax; i++) {
                monthOptions.push({ label: months[i % 12], value: ((i % 12)).toString() });
            }
            monthOptions = Array.from(monthOptions).sort((month1, month2) => month1.value - month2.value);
            this.monthOptions = [...monthOptions];
        } else {
            this.monthOptions = [...[]];
        }
    }
    formatIncome(monthValue, exRateValue) {
        return monthValue * exRateValue + ' VND';
    }
    updateDescriptionField() {
        let description = '';
        this.dataToUpdateDescription.forEach((month) => {
            if (month.monthValue) {
                description += this.formatDescription(month.monthIndex, month.monthValue, month.exrateValue);
                description += '\n';
            }
            if (month.monthIndex == 12) this.YEAR = this.YEAR + 1;
        });
        return description;
    }
    formatDescription(month, monthValue, exRateValue) {
        //month [1-12]
        let daysInMonth = this.daysInMonth(month, this.YEAR); // Caculate last days In Next Month
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
        return stringToFormat.replace(/{(\d+)}/gm, (match, index) =>
            (formattingArguments[index] === undefined ? '' : `${formattingArguments[index]}`)
        );
    }

    daysInMonth(iMonth, iYear) {
        return new Date(iYear, iMonth, 0).getDate();
    }
    handleBlurLookupInput(event) {
        const selectorString = event.target.dataset.drname;
        setTimeout(() => {
            let itemCmp = this.template.querySelector('.' + selectorString + '_dropdown');
            if (itemCmp) {
                itemCmp.className = selectorString + '_dropdown slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click';
            }
        }, 500);
    }
}