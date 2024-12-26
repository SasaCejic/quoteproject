import { LightningElement, api, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getRelatedListRecords } from 'lightning/uiRelatedListApi';
import { refreshApex } from '@salesforce/apex';

export default class AddProductsLWC extends LightningElement {
    @api recordId;
    isFlowVisible = false;
    quoteLineItems = [];
    wiredQuoteLineItems;

    // Prepare the input variable for the Flow
    get inputVariables() {
        return [
            {
                name: 'recordId',
                type: 'String',
                value: this.recordId
            }
        ];
    }

    columns = [
        { label: 'Product Name', fieldName: 'Product_Name__c', type: 'text' },
        { label: 'Unit Price', fieldName: 'UnitPrice', type: 'currency' },
        { label: 'Quantity', fieldName: 'Quantity', type: 'number' },
        { label: 'Description', fieldName: 'Beschreibung__c', type: 'text' },
        { label: 'Cost Rate Per Hour', fieldName: 'Cost_Rate_Per_Hour__c', type: 'currency' },
        { label: 'Total Sales Price', fieldName: 'Total_Sales_Price__c', type: 'currency' },
        { label: 'Costs', fieldName: 'Costs__c', type: 'currency' },
        { label: 'Margin', fieldName: 'Margin__c', type: 'percent' },
    ];

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
        this.wiredQuoteLineItems = result; // Store the result for refreshApex
        if (result.data) {
            this.quoteLineItems = result.data.records.map(record => {
                const fields = record.fields;
                return {
                    Id: record.id,
                    Product_Name__c: fields.Product_Name__c?.value || '',
                    UnitPrice: fields.UnitPrice?.value || 0,
                    Quantity: fields.Quantity?.value || 0,
                    Beschreibung__c: fields.Beschreibung__c?.value || '',
                    Cost_Rate_Per_Hour__c: fields.Cost_Rate_Per_Hour__c?.value || 0,
                    Total_Sales_Price__c: fields.Total_Sales_Price__c?.value || 0,
                    Costs__c: fields.Costs__c?.value || 0,
                    Margin__c: fields.Margin__c?.value ? fields.Margin__c.value / 100 : 0,
                };
            });
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
