namespace capbookstore01;

entity Books {
  key ID  : UUID;
  title   : String(100);
  author  : String(100);
  price   : Decimal(9,2);
  stock   : Integer;
  genre   : String(50);
}