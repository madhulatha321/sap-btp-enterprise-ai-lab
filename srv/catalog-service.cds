using capbookstore01 as db from '../db/schema';

service CatalogService {
  entity Books as projection on db.Books;

  action ask(question: String) returns array of Books;
}