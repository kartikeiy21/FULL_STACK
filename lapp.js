const express = require("express");
const app = express();
const path = require("path");
const livereload = require("livereload");
const connectLivereload = require("connect-livereload");

// Start a livereload server that watches this project folder (kept for compatibility)
const WATCH_PORT = 35729;
const lrServer = livereload.createServer({ exts: ['js','html','css'], port: WATCH_PORT });
const watchPath = path.join(__dirname);
lrServer.watch(watchPath);
console.log(`Livereload started (watching ${watchPath}), intended port ${WATCH_PORT}`);

// Fallback: implement our own SSE-based live reload using chokidar for reliable reloads
const chokidar = require('chokidar');
const sseClients = new Set();

app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders && res.flushHeaders();
  res.write('retry: 10000\n\n');
  sseClients.add(res);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

const watcher = chokidar.watch(watchPath, { ignored: /node_modules|\.git/, ignoreInitial: true });
watcher.on('all', (event, pathChanged) => {
  console.log('File change detected:', event, pathChanged);
  for (const client of sseClients) {
    try{ client.write('data: reload\n\n'); }catch(e){ /* ignore */ }
  }
});

// Inject livereload script into served HTML for automatic browser reloads
app.use(connectLivereload());

// Disable caching during development so changes always fetch fresh content
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

/* ================= NODE SERVER ================= */
app.get("/", (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Library Management System</title>

    <!-- React 17 CDN -->
    <script src="https://unpkg.com/react@17/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@17/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
            background-color: #ce419698;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
        }
        .container {
            max-width: 980px; /* increased width for larger white area */
            background-color: white;
            padding: 48px; /* more breathing room */
            border-radius: 12px;
            box-shadow: 0 12px 32px rgba(0,0,0,0.12);
            border: 2px solid rgba(0,0,0,0.06);
            text-align: center;
        }
        h1 {
            color: #090909;
            margin-bottom: 20px;
        }
        h3 {
            color: #080808;
            margin-top: 20px;
        }
        input {
            padding: 10px;
            margin: 10px;
            border: 2px solid #d58383; /* thicker border */
            border-radius: 5px;
            width: 80%;
            max-width: 300px;
        }

        /* Inputs used in the Add New Book section: left-aligned and consistent */
        .add-input {
            display: block;
            width: 80%;
            max-width: 300px;
            margin: 0; /* controlled by parent layout */
            text-align: left;
            box-sizing: border-box;
            border: 2px solid #d58383; /* match thickness */
            border-radius: 5px;
            padding: 8px;
        }

        /* Add form: inputs stacked at left, Add button on the right */
        .add-row {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 12px;
            align-items: center;
            width: 100%;
            max-width: 920px; /* match expanded container */
            margin: 12px auto;
        }
        .add-fields { display: flex; flex-direction: column; gap: 8px; }
        .add-actions { display: flex; align-items: center; justify-content: center; padding-left: 12px; }

        /* Responsive: stack on small screens */
        @media (max-width: 520px) {
          .add-row { grid-template-columns: 1fr; }
          .add-actions { justify-content: flex-start; padding-left: 0; margin-top: 8px; }
        }

        /* Larger search input */
        .search {
            width: 92%;
            max-width: 640px;
        }
        button {
            padding: 10px 20px;
            margin: 10px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            transition: background-color 0.3s;
        }
        button:hover {
            background-color: #45a049;
        }
        .book {
            display: grid;
            grid-template-columns: 1fr 160px;
            gap: 12px;
            align-items: center;
            max-width: 920px; /* match expanded container */
            margin: 14px auto;
            padding: 12px;
            background-color: #80abcf;
            border-radius: 8px;
            border: 2px solid #ba1212; /* slightly thicker */
        }
        .book button {
            background-color: #f44336;
            padding: 5px 10px;
        }
        .book-actions {
            display: flex;
            gap: 8px;
            align-items: center;
            justify-self: end;
            border-left: 2px solid rgba(0,0,0,0.08); /* slightly thicker */
            padding-left: 12px;
        }
        .book-meta {
            text-align: left;
            display: flex;
            flex-direction: column;
            gap: 4px;
            min-width: 0; /* allow truncation inside grid */
        }
        .book-meta .title { font-weight: 700; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin: 0; padding: 0; }
        .book-meta .author { font-size: 0.9em; color: #222; display: block; margin: 0; padding: 0; margin-top: 2px; }
        .book-input { width: 100%; padding: 8px; border-radius: 5px; border: 2px solid #d58383; box-sizing: border-box; }
        .book button:hover {
            background-color: #d32f2f;
        }
    </style>
</head>

<body>
    <div id="root"></div>

    <script type="text/babel">
        function LibraryApp() {

            /* ========== STATE MANAGEMENT (Hooks) ========== */
            const [books, setBooks] = React.useState([
                { id: 1, title: "Harry Potter", author: "J.K. Rowling" },
                { id: 2, title: "The Alchemist", author: "Paulo Coelho" },
                { id: 3, title: "To Kill a Mockingbird", author: "Harper Lee" },
                { id: 4, title: "Animal Farm", author: "George Orwell" },
                { id: 5, title: "Pride and Prejudice", author: "Jane Austen" }
            ]);

            const [newBook, setNewBook] = React.useState("");
            const [newAuthor, setNewAuthor] = React.useState("");
            const [search, setSearch] = React.useState("");

            // Edit state
            const [editingId, setEditingId] = React.useState(null);
            const [editTitle, setEditTitle] = React.useState("");
            const [editAuthor, setEditAuthor] = React.useState("");

            /* ========== ADD BOOK ========== */
            const addBook = () => {
                if (newBook.trim() === "") return;
                const author = newAuthor.trim() === "" ? "Unknown" : newAuthor.trim();
                setBooks([...books, { id: Date.now(), title: newBook.trim(), author }]);
                setNewBook("");
                setNewAuthor("");
            };

            /* ========== REMOVE BOOK ========== */
            const removeBook = (id) => {
                setBooks(books.filter(book => book.id !== id));
            };

            // Start editing a book
            const startEdit = (book) => {
                setEditingId(book.id);
                setEditTitle(book.title || "");
                setEditAuthor(book.author || "");
            };

            // Save edited book
            const saveEdit = (id) => {
                const title = editTitle.trim();
                const author = editAuthor.trim() === "" ? "Unknown" : editAuthor.trim();
                if (title === "") return; // require a title
                setBooks(books.map(b => b.id === id ? { ...b, title, author } : b));
                setEditingId(null);
                setEditTitle("");
                setEditAuthor("");
            };

            // Cancel editing
            const cancelEdit = () => {
                setEditingId(null);
                setEditTitle("");
                setEditAuthor("");
            };

            /* ========== SEARCH BOOK ========== */
            const filteredBooks = books.filter(book =>
                book.title.toLowerCase().includes(search.toLowerCase()) ||
                (book.author && book.author.toLowerCase().includes(search.toLowerCase()))
            );

            /* ========== UI ========== */
            return (
                <div className="container">
                    <h1> Library Management System</h1>

                    <input
                        className="search"
                        type="text"
                        placeholder="Search book"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    <h3>Add New Book</h3>
                    <div className="add-row">
                      <div className="add-fields">
                        <input
                            className="add-input"
                            type="text"
                            placeholder="Book name"
                            value={newBook}
                            onChange={(e) => setNewBook(e.target.value)}
                        />

                        <input
                            className="add-input"
                            type="text"
                            placeholder="Author name"
                            value={newAuthor}
                            onChange={(e) => setNewAuthor(e.target.value)}
                        />
                      </div>

                      <div className="add-actions">
                        <button onClick={addBook}>Add</button>
                      </div>
                    </div> 

                    <h3>Book List</h3>
                    {filteredBooks.map(book => (
                        <div className="book" key={book.id}>
                            {editingId === book.id ? (
                                <>
                                    <div className="book-meta">
                                        <input className="book-input" type="text" value={editTitle} onChange={(e)=>setEditTitle(e.target.value)} />
                                        <input className="book-input" type="text" value={editAuthor} onChange={(e)=>setEditAuthor(e.target.value)} />
                                    </div>
                                    <div className="book-actions">
                                        <button onClick={() => saveEdit(book.id)}>Save</button>
                                        <button onClick={cancelEdit}>Cancel</button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="book-meta">
                                        <span className="title">{book.title}</span>
                                        <small className="author">{book.author}</small>
                                    </div>
                                    <div className="book-actions">
                                        <button onClick={() => startEdit(book)}>Edit</button>
                                        <button onClick={() => removeBook(book.id)}>Remove</button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}  
                </div>
            );
        }

        ReactDOM.render(<LibraryApp />, document.getElementById("root"));
    </script>
    <!-- explicit livereload client (falls back if middleware injection fails) -->
    <script>
      (function(){
        try{
          var host = location.hostname || 'localhost';
          var s = document.createElement('script');
          s.src = 'http://' + host + ':35729/livereload.js?snipver=1';
          s.async = true;
          document.body.appendChild(s);
        }catch(e){ console.warn('Livereload client failed to load', e); }
      })();
    </script>

    <!-- SSE live-reload client (reliable local fallback) -->
    <script>
      (function(){
        try{
          if (!!window.EventSource) {
            var es = new EventSource('/events');
            es.onmessage = function(e){ if(e.data === 'reload') { console.log('Reload requested, reloading page.'); location.reload(); } };
            es.onerror = function(){ console.warn('SSE connection error for /events'); };
          }
        }catch(err){ console.warn('SSE reload client failed', err); }
      })();
    </script>
</body>
</html>
    `);
});

/* ================= SERVER START ================= */
app.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});
