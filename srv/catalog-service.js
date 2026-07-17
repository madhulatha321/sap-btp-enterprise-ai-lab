const cds = require("@sap/cds");

module.exports = cds.service.impl(async function () {
  const { Books } = this.entities;

  /**
   * Normalize a user question so intent detection is predictable.
   *
   * @param {unknown} value
   * @returns {string}
   */
  function normalizeQuestion(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\$/g, "")
      .replace(/\s+/g, " ");
  }

  /**
   * Convert a database book record into the public response structure.
   *
   * @param {object} book
   * @returns {object}
   */
  function toBookResult(book) {
    return {
      ID: book.ID,
      title: book.title,
      author: book.author,
      price: Number(book.price),
      stock: Number(book.stock),
      genre: book.genre
    };
  }

  /**
   * Format a monetary value consistently.
   *
   * @param {number} value
   * @returns {string}
   */
  function formatCurrency(value) {
    return `$${Number(value).toFixed(2)}`;
  }

  /**
   * Build the standard action response.
   *
   * @param {object} options
   * @param {string} options.intent
   * @param {string} options.message
   * @param {object[]} [options.books]
   * @param {{label:string,value:string}[]} [options.analytics]
   * @returns {object}
   */
  function buildResponse({
    intent,
    message,
    books = [],
    analytics = []
  }) {
    return {
      intent,
      message,
      resultCount: books.length,
      books: books.map(toBookResult),
      analytics
    };
  }

  /**
   * Extract a price threshold from phrases such as:
   * "under 50", "below $60", "less than 45".
   *
   * @param {string} question
   * @returns {number|null}
   */
  function extractPriceThreshold(question) {
    const match = question.match(
      /(?:under|below|less than)\s+(\d+(?:\.\d+)?)/
    );

    return match ? Number(match[1]) : null;
  }

  this.on("ask", async (req) => {
    const question = normalizeQuestion(req.data.question);

    if (!question) {
      return buildResponse({
        intent: "EMPTY_QUESTION",
        message:
          "Please enter a business question. For example: " +
          "\"Show SAP books under 60\" or \"What is the average price?\"."
      });
    }

    /*
     * For this learning POC, the complete data set is loaded once and
     * analytics are calculated in JavaScript.
     *
     * In the SAP HANA Cloud phase, aggregate calculations can be pushed
     * down to the database using CQN and native database capabilities.
     */
    const allBooks = await cds.run(
      SELECT.from(Books)
    );

    const books = allBooks.map(toBookResult);

    if (books.length === 0) {
      return buildResponse({
        intent: "NO_DATA",
        message: "No book records are currently available."
      });
    }

    /*
     * 1. Highest stock
     */
    if (
      question.includes("highest stock") ||
      question.includes("most stock") ||
      question.includes("maximum stock")
    ) {
      const highestStockBook = [...books].sort(
        (left, right) => right.stock - left.stock
      )[0];

      return buildResponse({
        intent: "HIGHEST_STOCK",
        message:
          `${highestStockBook.title} has the highest stock, ` +
          `with ${highestStockBook.stock} units available.`,
        books: [highestStockBook],
        analytics: [
          {
            label: "Highest stock",
            value: String(highestStockBook.stock)
          }
        ]
      });
    }

    /*
     * 2. Most expensive book
     */
    if (
      question.includes("most expensive") ||
      question.includes("highest price") ||
      question.includes("maximum price")
    ) {
      const mostExpensiveBook = [...books].sort(
        (left, right) => right.price - left.price
      )[0];

      return buildResponse({
        intent: "MOST_EXPENSIVE_BOOK",
        message:
          `${mostExpensiveBook.title} is the most expensive book ` +
          `at ${formatCurrency(mostExpensiveBook.price)}.`,
        books: [mostExpensiveBook],
        analytics: [
          {
            label: "Highest price",
            value: formatCurrency(mostExpensiveBook.price)
          }
        ]
      });
    }

    /*
     * 3. Cheapest book
     */
    if (
      question.includes("cheapest") ||
      question.includes("lowest price") ||
      question.includes("minimum price")
    ) {
      const cheapestBook = [...books].sort(
        (left, right) => left.price - right.price
      )[0];

      return buildResponse({
        intent: "CHEAPEST_BOOK",
        message:
          `${cheapestBook.title} is the cheapest book ` +
          `at ${formatCurrency(cheapestBook.price)}.`,
        books: [cheapestBook],
        analytics: [
          {
            label: "Lowest price",
            value: formatCurrency(cheapestBook.price)
          }
        ]
      });
    }

    /*
     * 4. Average book price
     */
    if (
      question.includes("average price") ||
      question.includes("mean price") ||
      question.includes("average book price")
    ) {
      const totalPrice = books.reduce(
        (sum, book) => sum + book.price,
        0
      );

      const averagePrice = totalPrice / books.length;

      return buildResponse({
        intent: "AVERAGE_PRICE",
        message:
          `The average price across ${books.length} books is ` +
          `${formatCurrency(averagePrice)}.`,
        analytics: [
          {
            label: "Average price",
            value: formatCurrency(averagePrice)
          },
          {
            label: "Books analysed",
            value: String(books.length)
          }
        ]
      });
    }

    /*
     * 5. Total inventory stock
     */
    if (
      question.includes("total stock") ||
      question.includes("total inventory") ||
      question.includes("inventory stock")
    ) {
      const totalStock = books.reduce(
        (sum, book) => sum + book.stock,
        0
      );

      return buildResponse({
        intent: "TOTAL_STOCK",
        message:
          `The total inventory stock is ${totalStock} units ` +
          `across ${books.length} book records.`,
        analytics: [
          {
            label: "Total stock",
            value: String(totalStock)
          },
          {
            label: "Book records",
            value: String(books.length)
          }
        ]
      });
    }

    /*
     * 6. Count books
     */
    if (
      question.includes("how many books") ||
      question.includes("number of books") ||
      question.includes("book count") ||
      question === "count books"
    ) {
      return buildResponse({
        intent: "BOOK_COUNT",
        message:
          `There are ${books.length} book records available.`,
        analytics: [
          {
            label: "Total books",
            value: String(books.length)
          }
        ]
      });
    }

    /*
     * 7. Genre summary
     */
    if (
      question.includes("genre summary") ||
      question.includes("books by genre") ||
      question.includes("genre count") ||
      question.includes("genre breakdown")
    ) {
      const genreCounts = books.reduce(
        (summary, book) => {
          const genre = book.genre || "Unclassified";

          summary[genre] =
            (summary[genre] || 0) + 1;

          return summary;
        },
        {}
      );

      const analytics = Object.entries(genreCounts)
        .sort((left, right) => {
          const countDifference = right[1] - left[1];

          return countDifference !== 0
            ? countDifference
            : left[0].localeCompare(right[0]);
        })
        .map(([genre, count]) => ({
          label: genre,
          value: String(count)
        }));

      const summaryText = analytics
        .map(
          (item) => `${item.label}: ${item.value}`
        )
        .join(", ");

      return buildResponse({
        intent: "GENRE_SUMMARY",
        message:
          `Genre distribution — ${summaryText}.`,
        analytics
      });
    }

    /*
     * 8. Price filtering
     *
     * Supports:
     * - Show books under 50
     * - Show SAP books under 60
     * - Show AI books below 55
     */
    const priceThreshold =
      extractPriceThreshold(question);

    if (priceThreshold !== null) {
      let filteredBooks = books;

      if (
        question.includes("sap")
      ) {
        filteredBooks = filteredBooks.filter(
          (book) =>
            book.genre.toLowerCase() === "sap"
        );
      } else if (
        question.includes("ai") ||
        question.includes("artificial intelligence")
      ) {
        filteredBooks = filteredBooks.filter(
          (book) =>
            book.genre.toLowerCase() ===
            "artificial intelligence"
        );
      }

      filteredBooks = filteredBooks.filter(
        (book) => book.price < priceThreshold
      );

      const categoryDescription =
        question.includes("sap")
          ? "SAP books"
          : (
              question.includes("ai") ||
              question.includes(
                "artificial intelligence"
              )
            )
            ? "Artificial Intelligence books"
            : "books";

      return buildResponse({
        intent: "PRICE_FILTER",
        message:
          filteredBooks.length === 0
            ? (
                `No ${categoryDescription} were found below ` +
                `${formatCurrency(priceThreshold)}.`
              )
            : (
                `I found ${filteredBooks.length} ` +
                `${categoryDescription} below ` +
                `${formatCurrency(priceThreshold)}.`
              ),
        books: filteredBooks,
        analytics: [
          {
            label: "Price threshold",
            value: formatCurrency(priceThreshold)
          },
          {
            label: "Matches",
            value: String(filteredBooks.length)
          }
        ]
      });
    }

    /*
     * 9. Artificial Intelligence books
     */
    if (
      question.includes("ai") ||
      question.includes("artificial intelligence")
    ) {
      const aiBooks = books.filter(
        (book) =>
          book.genre.toLowerCase() ===
          "artificial intelligence"
      );

      return buildResponse({
        intent: "AI_BOOKS",
        message:
          `I found ${aiBooks.length} Artificial Intelligence books.`,
        books: aiBooks,
        analytics: [
          {
            label: "AI books",
            value: String(aiBooks.length)
          }
        ]
      });
    }

    /*
     * 10. SAP books
     */
    if (question.includes("sap")) {
      const sapBooks = books.filter(
        (book) =>
          book.genre.toLowerCase() === "sap"
      );

      return buildResponse({
        intent: "SAP_BOOKS",
        message:
          `I found ${sapBooks.length} SAP books.`,
        books: sapBooks,
        analytics: [
          {
            label: "SAP books",
            value: String(sapBooks.length)
          }
        ]
      });
    }

    /*
     * 11. Show all books
     */
    if (
      question.includes("show all books") ||
      question.includes("list all books") ||
      question === "show books" ||
      question === "list books"
    ) {
      return buildResponse({
        intent: "ALL_BOOKS",
        message:
          `I found ${books.length} available book records.`,
        books,
        analytics: [
          {
            label: "Total books",
            value: String(books.length)
          }
        ]
      });
    }

    /*
     * 12. Unsupported question
     */
    return buildResponse({
      intent: "UNSUPPORTED_QUESTION",
      message:
        "I could not map that question to a supported business intent. " +
        "Try: average price, total stock, cheapest book, most expensive " +
        "book, highest stock, genre summary, SAP books, AI books, or " +
        "books under 50."
    });
  });
});