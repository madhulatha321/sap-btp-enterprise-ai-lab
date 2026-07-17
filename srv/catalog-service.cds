using capbookstore01 as db from '../db/schema';

service CatalogService {

    entity Books as projection on db.Books;

    type BookResult {
        ID     : UUID;
        title  : String(255);
        author : String(150);
        price  : Decimal(9,2);
        stock  : Integer;
        genre  : String(100);
    }

    type AnalyticsItem {
        label : String(100);
        value : String(255);
    }

    type AskResponse {
        intent      : String(100);
        message     : String(1000);
        resultCount : Integer;
        books       : many BookResult;
        analytics   : many AnalyticsItem;
    }

    action ask(
        question : String
    ) returns AskResponse;
}