const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {
  const { Books } = this.entities;

  this.on('ask', async (req) => {
    const question = (req.data.question || '').toLowerCase();

    let books = await SELECT.from(Books);

    if (question.includes('sap')) {
      books = books.filter(book => book.genre === 'SAP');
    }

    if (question.includes('ai') || question.includes('artificial intelligence')) {
      books = books.filter(book => book.genre === 'Artificial Intelligence');
    }

    if (
      question.includes('under 60') ||
      question.includes('below 60') ||
      question.includes('less than 60')
    ) {
      books = books.filter(book => Number(book.price) < 60);
    }

    if (question.includes('highest stock')) {
      books = books.sort((a, b) => b.stock - a.stock).slice(0, 1);
    }

    return books;
  });
});