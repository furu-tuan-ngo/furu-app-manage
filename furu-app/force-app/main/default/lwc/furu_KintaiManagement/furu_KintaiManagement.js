import {
    LightningElement
} from 'lwc';
import CalendarResource from '@salesforce/resourceUrl/Furu_FullCalendar';
import PopperResource from '@salesforce/resourceUrl/Popper';
import TooltipResource from '@salesforce/resourceUrl/Tooltip';
import {
    ShowToastEvent
} from 'lightning/platformShowToastEvent';
import {
    loadStyle,
    loadScript
} from 'lightning/platformResourceLoader';
export default class Furu_KintaiManagement extends LightningElement {
    fullCalendarInitialized = false;
    isLoadedCalendar = true;
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
            console.log(error.message);
        });
    }
    errorCallback(error, stack) {
        console.log(error);
    }
    initialiseFullCalendar() {
        const calendarEl = this.template.querySelector('div.fullcalendar');
        let calendar = new FullCalendar.Calendar(calendarEl, {
            plugins: [ 'resourceTimeline'],
            defaultView: 'resourceTimelineMonth',
            header: {
                left: 'prev',
                center: 'title',
                right: 'resourceTimelineDay,resourceTimelineMonth next',
            },
            resourceColumns: [
                {
                  labelText: 'Contacts',
                  field: 'title'
                },
            ],
            aspectRatio: 3,
            editable: false,
            //resourceLabelText: 'Accounts',
            eventTextColor: 'white',
            resources: [
                { id: 'a', title: 'Tâm' },
                { id: 'b', title: 'Tuấn', eventColor: 'green' },
                
            ],
            events: [
                { id: '1', resourceId: 'a', start: '2020-04-07 10:34:57', end: '2020-04-07 10:34:59', title: 'event 1' },
                { id: '2', resourceId: 'a', start: '2020-04-07 10:49:29', end: null, title: 'event 2' },
                { id: '3', resourceId: 'a', start: '2020-04-08 09:29:23', end: null, title: 'event 3' },
                { id: '4', resourceId: 'b', start: '2020-04-07 11:38:38', end: '2020-04-07 11:38:35', title: 'event 4' },
                { id: '5', resourceId: 'b', start: '2020-04-08 02:23:53', end: null, title: 'event 5' },
            ],
            eventRender: (info) => {
                console.log(info);
                const checkInTime = info.event.start ? new Date(info.event.start) : null;
                const checkOutTime = info.event.end ? new Date(info.event.end) : null;
                let amountHourWork = 0;
                if (!checkInTime && checkOutTime){
                    amountHourWork = checkOutTime.getHours() - 13; 
                }
                else if (checkInTime && !checkOutTime){
                    amountHourWork = 12 - checkInTime.getHours();
                }
                else if (checkInTime && checkOutTime){
                    amountHourWork = checkOutTime.getHours() - checkInTime.getHours();
                }

                //Change title depend on amountHourWork
                let point = 0;
                if (amountHourWork < 7 && amountHourWork > 4){
                    point = -0.25;
                }
                else if (amountHourWork <= 4 && amountHourWork >= 1){
                    point = -0.5;
                }
                else if (amountHourWork < 1){
                    point = -1;
                }
                info.el.innerHTML = point;
                //Display tooltip
                let titleEl = document.createElement('ul'); //Container

                //Create amountHourWorkEl 
                let amountHourWorkEl = document.createElement('li');
                amountHourWorkEl.innerHTML = 'Số giờ làm việc: ' + amountHourWork;

                // Check checkInTime whether null or not
                let checkInTimeText = 'In: ';
                checkInTimeText += checkInTime ? checkInTime.toLocaleTimeString() : 'Off';
                let checkInTimeEl = document.createElement('li');
                checkInTimeEl.innerHTML = checkInTimeText;

                // Check checkOutTime whether null or not
                let checkOutTimeText = 'Out: ';
                checkOutTimeText += checkOutTime ? checkOutTime.toLocaleTimeString() : 'Off';
                let checkOutTimeEl = document.createElement('li');
                checkOutTimeEl.innerHTML = checkOutTimeText;
                
                titleEl.appendChild(checkInTimeEl);
                titleEl.appendChild(checkOutTimeEl);
                titleEl.appendChild(amountHourWorkEl);

                let tooltip = new Tooltip(info.el, {
                    title: titleEl,
                    placement: 'top',
                    trigger: 'hover',
                    container: 'body',
                    html: true,
                });
            },
            schedulerLicenseKey: 'GPL-My-Project-Is-Open-Source',
        });
        calendar.render();
    }
}