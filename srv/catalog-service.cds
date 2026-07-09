using capbookstore01 as db from '../db/schema';
service CatalogService {
  entity Books as projection on db.Books;
}