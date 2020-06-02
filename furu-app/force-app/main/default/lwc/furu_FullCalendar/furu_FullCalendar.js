import {
    LightningElement
} from 'lwc';
import CalendarResource from '@salesforce/resourceUrl/Furu_FullCalendar';
import PopperResource from '@salesforce/resourceUrl/Popper';
import TooltipResource from '@salesforce/resourceUrl/Tooltip';
import {
    ShowToastEvent
} from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
import {
    loadStyle,
    loadScript
} from 'lightning/platformResourceLoader';
import getResources from '@salesforce/apex/FURU_ContractManagermentController.getResources';
import getEvents from '@salesforce/apex/FURU_ContractManagermentController.getEvents';

export default class Furu_FullCalendar extends NavigationMixin(LightningElement) {
    
    fullCalendarInitialized = false;
    isLoadedCalendar = false;
    resources = [];
    filterOptions = {
        "All": "",
        "Customer": "Customer",
        "Partner": "Partner",
    };
    labelFilter = 'Filter Account';
    mapClass = {
        "headerContainer": 'header-container',
        "headerIncome": 'income-header',
        "filterAccount": 'filter-account',
        "headerFilter": 'header-filter',
    };
    calendarObject;
    filterType = "";
    posIncome = 0;
    negIncome = 0;
    totalAccounts = 0;
    totalExpectAccounts = 0;
    mapResources = new Map();
    mode;
    renderedCallback() { // invoke the method when component rendered or loaded
        if (this.fullCalendarInitialized) return;
        this.fullCalendarInitialized = true;
        Promise.all([
            loadScript(this, CalendarResource + '/packages/core/main.js'),
            loadStyle(this, CalendarResource + '/packages/core/main.min.css'),
        ]).then(() => {
            return Promise.all([
                loadScript(this, CalendarResource + '/packages/interaction/main.js'),
                //loadStyle(this, CalendarResource + '/packages/interaction/main.min.css'),
            ]);
        }).then(() => {
            return Promise.all([
                loadScript(this, CalendarResource + '/packages-premium/timeline/main.js'),
                loadStyle(this, CalendarResource + '/packages-premium/timeline/main.min.css'),
            ]);
        }).then(() => {
            return Promise.all([
                loadScript(this, CalendarResource + '/packages-premium/resource-common/main.js'),
            ]);
        }).then(() => {
            return Promise.all([
                loadScript(this, CalendarResource + '/packages-premium/resource-timeline/main.js'),
                loadStyle(this, CalendarResource + '/packages-premium/resource-timeline/main.min.css'),
            ]);
        }).then(() => {
            return Promise.all([
                loadScript(this, PopperResource + '/popper.js/dist/umd/popper.min.js'),
            ]);
        }).then(() => {
            return Promise.all([
                loadScript(this, TooltipResource + '/tooltip.js/dist/umd/tooltip.min.js'),
            ]);
        }).then(() => {
            return Promise.all([
                loadStyle(this, CalendarResource + '/showTooltip.css'),
            ]);
        }).then(() => {
            this.initialiseFullCalendar();
        }).catch(error => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error loading full calendar',
                    message: error.message,
                    variant: 'error'
                })
            );
        });
    }
    errorCallback(error, stack) {
        console.log(error);
    }
    initialiseFullCalendar() {
        const calendarEl = this.template.querySelector('div.fullcalendar');
        let calendar = new FullCalendar.Calendar(calendarEl, {
            plugins: [ 'resourceTimeline'],
            defaultView: 'resourceTimelineYear',
            timeZone: 'UTC',
            header: {
                left: 'prev',
                center: 'title',
                right: 'resourceTimelineMonth,resourceTimelineYear next',
            },
            views : {
                resourceTimelineYear : {
                    slotDuration: { months: 1},
                },
                resourceTimelineMonth : {
                    slotDuration: { weeks: 1},  
                },
            },
            resourceColumns: [
                {
                  labelText: 'Accounts',
                  field: 'title'
                },
            ],
            aspectRatio: 3,
            editable: false,
            //resourceLabelText: 'Accounts',
            eventTextColor: 'white',
            resources: (fetchInfo, successCallback, failureCallback) => {
                if (this.resources.length > 0){
                    let filterResources = this.resources;
                    //Filter resource based on recordType
                    if (this.filterType){
                        filterResources = this.resources.filter(resource => resource.recordType == this.filterType);
                    }
                    this.totalAccounts = filterResources.length;
                    switch(this.mode){
                        case "resourceTimelineYear":{
                            this.totalExpectAccounts  = this.totalAccounts;
                            break;
                        }
                        case "resourceTimelineMonth":{
                            this.totalExpectAccounts = 0;
                            break;
                        }
                    }
                    this.updateIncomeDOM(this.posIncome, this.negIncome, this.totalExpectAccounts);
                    //console.log(filterResources);
                    successCallback(filterResources);
                }
                else{
                    getResources()
                    .then(result => {
                        let resources = [];
                        let arrayColors = [];
                        result.forEach((item, index) => {
                            const eventColor = this.getEventColor(arrayColors);
                            arrayColors.push(eventColor);
                            resources.push({
                                id: item.id,
                                title: item.title,
                                recordType: item.recordType || null,
                                eventBackgroundColor: eventColor,
                                eventBorderColor: eventColor,
                            });
                        });
                        //console.log(resources);
                        this.totalAccounts = resources.length;
                        this.resources = resources;
                        successCallback(resources);
                    })
                    .catch(error => {
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'Error loading full calendar',
                                message: error.message,
                                variant: 'error'
                            })
                        );
                    });
                }
                
            },
            events: (fetchInfo, successCallback, failureCallback) => {
                getEvents({year: fetchInfo.start.getFullYear()})
                .then(result => {
                    let events = [];
                    if(result && result.length > 0) {
                        result.forEach((item, index) => {
                            let event = item;
                            event.end= item.finish;
                            events.push(event);
                        });
                    }
                    console.log(events);
                    successCallback(events);
                })
                .catch(error => {
                    console.log(error.message);
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Error loading full calendar',
                            message: error.message,
                            variant: 'error'
                        })
                    );
                });
            },
            viewSkeletonRender: (info) => {
                this.isLoadedCalendar = true;
            },
            datesRender : (info) => {
                this.mode = info.view.type;
                switch(info.view.type){
                    case "resourceTimelineMonth":{
                        this.totalExpectAccounts = 0;
                        break;
                    }
                    case "resourceTimelineYear":{
                        this.totalExpectAccounts = this.totalAccounts;
                        break;
                    }
                }
                this.createToolHeader();
                // If event dont render (dont have any events)
                this.updateIncomeDOM(this.posIncome, this.negIncome, this.totalExpectAccounts);
            },
            eventRender: (info) => {
                let tooltip = new Tooltip(info.el, {
                    title: 'Value: ' + info.event.extendedProps.income,
                    placement: 'top',
                    trigger: 'hover',
                    container: 'body'
                });
            },
            eventPositioned : (info) => {
                let income = Number(info.event.extendedProps.income.replace(/[^0-9.-]+/g,""));
                let type = info.view.type;
                //Handle income for every year/month/....
                switch (type){
                    case "resourceTimelineMonth": {
                        //In mode month, totalAccount = totalResource have at least 1 contract
                        let resourceId = info.event.getResources()[0].id; //Maybe hardcode
                        if (!this.mapResources.get(resourceId)){
                            this.mapResources.set(resourceId, {totalEvents: 1});
                            this.totalExpectAccounts = this.totalExpectAccounts + 1;
                        }
                        else{
                            //Optional
                            this.mapResources.get(resourceId).totalEvents++;
                        }
                        break;
                    }
                    case "resourceTimelineYear": {
                        this.totalExpectAccounts = this.totalAccounts;
                    }
                }
                if (income > 0) this.posIncome += income;
                else this.negIncome += income;
                this.updateIncomeDOM(Number.parseFloat(this.posIncome.toFixed(2)), Number.parseFloat(this.negIncome.toFixed(2)), this.totalExpectAccounts);
            },
            eventDestroy : (info) => {
                //Will not work if using add event/remove event utility.
                this.resetGlobalValue();
            },
            eventClick: (eventInfo) => {
                if(eventInfo.event.id) {
                    this[NavigationMixin.Navigate]({
                        type: 'standard__recordPage',
                        attributes: {
                            recordId: eventInfo.event.id,
                            objectApiName: 'Contract',
                            actionName: 'view',
                        }
                    });
                }
            },
            schedulerLicenseKey: 'GPL-My-Project-Is-Open-Source'
        });
        this.calendarObject = calendar;
        calendar.render();
    }
    resetGlobalValue(){
        this.posIncome = 0;
        this.negIncome = 0;
        this.totalExpectAccounts = 0;
        this.mapResources = new Map();
    }
    getEventColor(arrayColors) {
        let letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        if (!arrayColors.includes(color)){
            return color;
        }
        return getEventColor(arrayColors);
    }
    updateIncomeDOM(posIncome, negIncome, totalAccounts){
        const selector = this.getSelector(this.mapClass['headerIncome']);
        let container = this.template.querySelector(selector);
        const formatter = new Intl.NumberFormat();
        let posIncomeEl =  container.querySelector('.income-positive');
        posIncomeEl.innerHTML = 'Doanh Thu : ' + formatter.format(posIncome) + ' VND';
        let negIncomeEl =  container.querySelector('.income-negative');
        negIncomeEl.innerHTML = 'Chi Phí : ' + formatter.format(negIncome) + ' VND';
        let totalIncomeEl =  container.querySelector('.income-total');
        totalIncomeEl.innerHTML = 'Lợi Nhuận : ' + formatter.format(posIncome + negIncome) + ' VND';
        let totalAccountsEl =  container.querySelector('.account-total');
        totalAccountsEl.innerHTML = 'Tổng số khách hàng : ' + totalAccounts;
    }
    initIncomeDOM(){
        let newContainer = document.createElement('div');
        newContainer.className = this.mapClass['headerIncome'];
        let posIncomeEl = document.createElement('div');
        posIncomeEl.className = 'income-positive';
        let negIncomeEl = document.createElement('div');
        negIncomeEl.className = 'income-negative';
        let totalIncomeEl = document.createElement('div');
        totalIncomeEl.className = 'income-total';
        let totalAccountsEl = document.createElement('div');
        totalAccountsEl.className = 'account-total';
        newContainer.appendChild(posIncomeEl);
        newContainer.appendChild(negIncomeEl);
        newContainer.appendChild(totalIncomeEl);
        newContainer.appendChild(totalAccountsEl);
        return newContainer;
    }
    initFilterDOM(){
        let optionsHTML = '';
        Object.keys(this.filterOptions).forEach(key => {
            optionsHTML += '<option value="' + this.filterOptions[key] + '">' + key + '</option>';
        });
        const selectFilterHTML = '<div class="slds-form-element">' +
                            '<label class="slds-form-element__label" for="select-filter"><b>' + this.labelFilter + '</b></label>' +
                            '<div class="slds-form-element__control">' +
                                '<div class="slds-select_container">' +
                                    '<select class="slds-select ' + this.mapClass["filterAccount"] + '"' + ' id="select-filter">' +
                                        optionsHTML +
                                    '</select>' +
                                '</div>' +
                            '</div>' + 
                         '</div>';
        let filterContainer = document.createElement('div');
        filterContainer.className = this.mapClass["headerFilter"];
        filterContainer.insertAdjacentHTML("beforeend", selectFilterHTML); //Append as the last child
        
        return filterContainer;
    }
    createToolHeader(){
        let calendarDOM = this.template.querySelector('.fc-toolbar.fc-header-toolbar').parentNode;
        const headerContainerSelector = this.getSelector(this.mapClass['headerContainer']);
        const oldHeaderContainer = this.template.querySelector('.slds-grid.slds-grid_align-spread' + headerContainerSelector);
        if (oldHeaderContainer){
            calendarDOM.removeChild(oldHeaderContainer);
            calendarDOM.insertBefore(oldHeaderContainer, calendarDOM.childNodes[0]);
            return;
        }
        let headerContainer = document.createElement('div');
        headerContainer.className = 'slds-grid slds-grid_align-spread ' + this.mapClass['headerContainer'];
        let headerSectionLeft = this.initIncomeDOM();
        let headerSectionRight = this.initFilterDOM();
        headerSectionLeft.classList.add('slds-col');
        headerSectionRight.classList.add('slds-col');
        headerContainer.appendChild(headerSectionLeft);
        headerContainer.appendChild(headerSectionRight);
        calendarDOM.insertBefore(headerContainer, calendarDOM.childNodes[0]);
        //Add event listener for select
        let selectElement = this.template.querySelector('.slds-select' + this.getSelector(this.mapClass['filterAccount']));
        selectElement.addEventListener('change', () => {
            this.handleFilterChange();
        });
    }
    getSelector(classesString){
        const classes = classesString.split(' ');
        let selector = '';
        classes.forEach(c => {
            selector += '.' + c;
        });
        return selector;
    }
    handleFilterChange(){
        let selectElement = this.template.querySelector('.slds-select' + this.getSelector(this.mapClass['filterAccount']));
        if (selectElement){
            this.filterType = selectElement.value;
            this.resetGlobalValue();
            this.calendarObject.refetchResources();
            //Set all value to default, waiting new event render for updating DOM 
            this.calendarObject.refetchEvents();
        }
    }
}