import { LightningElement, api, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getRelatedListRecords } from 'lightning/uiRelatedListApi';
import { updateRecord, deleteRecord } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';

export default class AddProductsLWC extends LightningElement {
    @api recordId;
    isFlowVisible = false;
    quoteLineItems = [];
    showTable = false;
    wiredQuoteLineItems;

    // Prepare the input variable for the Flow
    get inputVariables() {
        return [
            {
                name: 'recordId',
                type: 'String',
                value: this.recordId,
            },
        ];
    }

    columns = [
        {
            label: 'Product Name',
            fieldName: 'ProductLink', // New field for URL
            type: 'url',
            typeAttributes: { label: { fieldName: 'Product_Name__c' }, target: '_blank' },
        },
        { label: 'Unit Price', fieldName: 'UnitPrice', type: 'currency', editable: true },
        { label: 'Quantity', fieldName: 'Quantity', type: 'number', editable: true },
        { label: 'Description', fieldName: 'Beschreibung__c', type: 'text', editable: true },
        { label: 'Cost Rate Per Hour', fieldName: 'Cost_Rate_Per_Hour__c', type: 'currency', editable: true },
        { label: 'Total Sales Price', fieldName: 'Total_Sales_Price__c', type: 'currency', editable: false },
        { label: 'Costs', fieldName: 'Costs__c', type: 'currency', editable: false },
        { label: 'Margin', fieldName: 'Margin__c', type: 'percent', editable: false },
        {
            type: 'action',
            typeAttributes: { rowActions: this.getRowActions },
        },
    ];

    getRowActions(row, doneCallback) {
        const actions = [
            { label: 'Delete', name: 'delete' },
        ];
        doneCallback(actions);
    }

    @wire(getRelatedListRecords, {
        parentRecordId: '$recordId',
        relatedListId: 'QuoteLineItems',
        fields: [
            'QuoteLineItem.Product_Name__c',
            'QuoteLineItem.UnitPrice',
            'QuoteLineItem.Quantity',
            'QuoteLineItem.Beschreibung__c',
            'QuoteLineItem.Cost_Rate_Per_Hour__c',
            'QuoteLineItem.Total_Sales_Price__c',
            'QuoteLineItem.Costs__c',
            'QuoteLineItem.Margin__c',
        ],
    })
    wiredRecords(result) {
        this.wiredQuoteLineItems = result;
        if (result.data) {
            this.quoteLineItems = result.data.records.map(record => {
                const fields = record.fields;
                return {
                    Id: record.id,
                    Product_Name__c: fields.Product_Name__c?.value || '',
                    ProductLink: `/lightning/r/QuoteLineItem/${record.id}/view`, // URL to the record page
                    UnitPrice: fields.UnitPrice?.value || 0,
                    Quantity: fields.Quantity?.value || 0,
                    Beschreibung__c: fields.Beschreibung__c?.value || '',
                    Cost_Rate_Per_Hour__c: fields.Cost_Rate_Per_Hour__c?.value || 0,
                    Total_Sales_Price__c: fields.Total_Sales_Price__c?.value || 0,
                    Costs__c: fields.Costs__c?.value || 0,
                    Margin__c: fields.Margin__c?.value ? fields.Margin__c.value / 100 : 0,
                };
            });
            if (this.quoteLineItems.length > 0) {
                this.showTable = true;
            }
        } else if (result.error) {
            this.showErrorToast('Error fetching related records', result.error.body.message);
        }
    }

    handleLaunchFlow() {
        if (!this.recordId) {
            this.showErrorToast('Error', 'Record Id is missing. Please make sure the component is placed on a record page.');
            return;
        }
        this.isFlowVisible = true;
    }

    handleStatusChange(event) {
        if (event.detail.status === 'FINISHED') {
            this.isFlowVisible = false;

            // Refresh the related list
            refreshApex(this.wiredQuoteLineItems)
                .then(() => {
                    this.showSuccessToast('Product added successfully!');
                })
                .catch(error => {
                    this.showErrorToast('Error refreshing related list', error.body.message);
                });
        }
    }

    handleCellChange(event) {
        const updatedFields = event.detail.draftValues[0];
        updateRecord({ fields: updatedFields })
            .then(() => {
                this.showSuccessToast('Record updated successfully!');
                return refreshApex(this.wiredQuoteLineItems);
            })
            .catch(error => {
                this.showErrorToast('Error updating record', error.body.message);
            });
    }

    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;
        if (actionName === 'delete') {
            this.deleteRow(row.Id);
        }
    }

    deleteRow(recordId) {
        deleteRecord(recordId)
            .then(() => {
                this.showSuccessToast('Record deleted successfully!');
                if (this.quoteLineItems.length == 0) {
                    this.showTable = false;
                }
                return refreshApex(this.wiredQuoteLineItems);
            })
            .catch(error => {
                this.showErrorToast('Error deleting record', error.body.message);
            });
    }

    showSuccessToast(message) {
        const event = new ShowToastEvent({
            title: 'Success',
            message: message,
            variant: 'success',
        });
        this.dispatchEvent(event);
    }

    showErrorToast(title, message) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: 'error',
        });
        this.dispatchEvent(event);
    }
}
