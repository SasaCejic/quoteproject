import { LightningElement, api, wire, track } from 'lwc';
import { getRelatedListRecords } from 'lightning/uiRelatedListApi';
import UNIT_PRICE_FIELD from '@salesforce/schema/QuoteLineItem.UnitPrice';
import QUANTITY_FIELD from '@salesforce/schema/QuoteLineItem.Quantity';
import BESCHREIBUNG_FIELD from '@salesforce/schema/QuoteLineItem.Beschreibung__c';

export default class QuoteLineItemTable extends LightningElement {
    @api recordId;
    @track quoteLineItems = [];
    error;

    @wire(getRelatedListRecords, {
        parentRecordId: '$recordId',
        relatedListId: 'QuoteLineItems', // 'QuoteLineItems' should be the correct related list API name
        fields: [UNIT_PRICE_FIELD, QUANTITY_FIELD, BESCHREIBUNG_FIELD]
    })
    wiredQuoteLineItems({ error, data }) {
        if (data) {
            if (data.records && data.records.length > 0) {
                this.quoteLineItems = data.records.map((item, index) => ({
                    id: item.id,
                    rowNumber: index + 1,
                    unitPrice: item.fields?.UnitPrice?.value ?? 'N/A',
                    quantity: item.fields?.Quantity?.value ?? 'N/A',
                    beschreibung: item.fields?.Beschreibung__c?.value ?? 'N/A'
                }));
            } else {
                this.quoteLineItems = [];
            }
            this.error = undefined;
        } else if (error) {
            this.error = error;
            console.error('Error fetching quote line items:', error);
            this.quoteLineItems = [];
        }
    }

    get hasItems() {
        return this.quoteLineItems.length > 0;
    }
}
