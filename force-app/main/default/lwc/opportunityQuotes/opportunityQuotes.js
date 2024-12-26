import { LightningElement, api, wire } from 'lwc';
import { getRelatedListRecords } from 'lightning/uiRelatedListApi';

const columns = [
    {
        label: 'Quote Name',
        fieldName: 'quoteLink',
        type: 'url',
        typeAttributes: {
            label: { fieldName: 'Name' }, // This will display the Quote Name
            target: '_blank' // Opens in a new tab
        }
    },
    { label: 'Subtotal', fieldName: 'Subtotal', type: 'currency' },
    { label: 'Status', fieldName: 'Status' }
];

export default class OpportunityQuotes extends LightningElement {
    @api recordId; // Opportunity Id passed from the record page
    quotes;
    error;
    columns = columns;

    // Get all related Quotes using lightning/uiRelatedListApi
    @wire(getRelatedListRecords, {
        parentRecordId: '$recordId',
        relatedListId: 'Quotes',
        fields: ['Quote.Id', 'Quote.Name', 'Quote.Subtotal', 'Quote.Status']
    })
    wiredQuotes({ error, data }) {
        if (data) {
            // Create a link to the record page for each quote
            this.quotes = data.records.map(record => {
                return {
                    Id: record.fields.Id.value,
                    Name: record.fields.Name.value,
                    Subtotal: record.fields.Subtotal.value,
                    Status: record.fields.Status.value,
                    quoteLink: `/lightning/r/Quote/${record.fields.Id.value}/view`
                };
            });
            this.error = undefined;
        } else if (error) {
            this.error = error;
            this.quotes = undefined;
        }
    }
}
