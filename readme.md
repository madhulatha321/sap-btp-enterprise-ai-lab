# SAP BTP Enterprise AI Lab

Personal SAP Enterprise AI Architect learning portfolio built on SAP BTP Trial.

## Phase 1: CAP Foundation

Status: Completed

This phase creates the foundation for future Enterprise AI proof-of-concepts using SAP Cloud Application Programming Model.

## Current Features

- CAP Node.js project
- CDS data model
- Books entity
- CatalogService OData service
- CSV-based sample data
- SQLite local persistence
- Fiori Preview validation
- GitHub version control

## Architecture

User  
→ Fiori Preview  
→ CAP CatalogService  
→ Books Entity  
→ SQLite / CSV Data

## Project Structure

```text
app/
db/
  schema.cds
  data/
    capbookstore01-Books.csv
srv/
  catalog-service.cds
package.json
readme.md