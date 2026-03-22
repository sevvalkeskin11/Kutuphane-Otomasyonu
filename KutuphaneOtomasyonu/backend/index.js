const express = require("express");
const sql = require("mssql");
const cors = require("cors");
const bcrypt = require("bcrypt");

const app = express();
const port = 3001;
console.log("✅ Sunucu başlıyor...")
app.use(cors());
app.use(express.json());

const config = {
  user: "sa",
  password: "Gizli1234!",
  server: "localhost",
  database: "UniLib",
  options: {
    trustServerCertificate: true,
  },
};

app.get("/books", async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query(`
    SELECT * FROM vw_BookDetails
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error("Veri çekilemedi:", err);
    res.status(500).send("Sunucu hatası");
  }
});
// POST /books/add
app.post("/books/add", async (req, res) => {
  const {
    ISBN,
    BookTitle,
    PublicationDate,
    StockStatus,
    AvailabilityStatus,
    ImageUrl,
    LocationID,
    AuthorID,
    CategoryID
  } = req.body;

  try {
    await sql.connect(config);

    
    const existingBook = await sql.query`
      SELECT ISBN FROM BookInfo WHERE ISBN = ${ISBN}
    `;

    if (existingBook.recordset.length > 0) {
      return res.status(400).json({ message: "Bu ISBN numarası zaten kayıtlı." });
    }

    const transaction = new sql.Transaction();
    await transaction.begin();

    try {
      await transaction.request().query`
        INSERT INTO BookInfo (ISBN, BookTitle, StockStatus, PublicationDate, AvailabilityStatus)
        VALUES (${ISBN}, ${BookTitle}, ${StockStatus}, ${PublicationDate}, ${AvailabilityStatus})
      `;

      await transaction.request().query`
        INSERT INTO Books (ISBN, ImageUrl, LocationID)
        VALUES (${ISBN}, ${ImageUrl}, ${LocationID})
      `;

      const bookIdResult = await transaction.request().query`
        SELECT BookID FROM Books WHERE ISBN = ${ISBN}
      `;
      const bookId = bookIdResult.recordset[0].BookID;

      // Yazar bağlantısını ekle
      await transaction.request().query`
        INSERT INTO AuthorBook (BookID, AuthorID)
        VALUES (${bookId}, ${AuthorID})
      `;

      // Kategori bağlantısını ekle
      await transaction.request().query`
        INSERT INTO BooksInCategories (BookID, CategoryID)
        VALUES (${bookId}, ${CategoryID})
      `;

      // Transaction'ı onayla
      await transaction.commit();
      
      console.log("✅ Kitap başarıyla eklendi");
      res.status(201).json({ message: "Kitap başarıyla eklendi." });
    } catch (err) {
      // Hata durumunda transaction'ı geri al
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error("❌ Kitap ekleme hatası:", err);
    res.status(500).json({ 
      message: "Kitap eklenemedi.", 
      error: err.message 
    });
  }
});
app.get("/dropdowns", async (req, res) => {
  try {
    await sql.connect(config);

    const authors = await sql.query`SELECT AuthorID, FirstName, LastName FROM Authors`;
    const categories = await sql.query`SELECT CategoryID, CategoryName FROM Category`;
    const locations = await sql.query`SELECT LocationID, RoomName, ShelfName FROM Location`;

    res.json({
      authors: authors.recordset,
      categories: categories.recordset,
      locations: locations.recordset,
    });
  } catch (err) {
    console.error("❌ Dropdown verileri alınamadı:", err);
    res.status(500).json({ message: "Dropdown verileri alınamadı" });
  }
});


app.get("/stats", async (req, res) => {
  try {
    await sql.connect(config);

    const totalBooksQuery = await sql.query`SELECT COUNT(*) AS totalBooks FROM Books`;
    const totalUsersQuery = await sql.query`SELECT COUNT(*) AS totalUsers FROM Users`;
    const totalRentalsQuery = await sql.query`SELECT COUNT(*) AS totalRentals FROM LoanTransaction`;

    res.json({
      totalBooks: totalBooksQuery.recordset[0].totalBooks,
      totalUsers: totalUsersQuery.recordset[0].totalUsers,
      LoanTransaction: totalRentalsQuery.recordset[0].totalRentals,
    });
  } catch (err) {
    console.error("❌ /stats hatası:", err);
    res.status(500).json({ message: "Sunucu hatası" });
  }
});


app.get("/users", async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query`SELECT * FROM Users`;
    res.json(result.recordset);
  } catch (err) {
    console.error("Kullanıcılar alınamadı:", err);
    res.status(500).json({ message: "Sunucu hatası" });
  }
});

app.delete("/users/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await sql.connect(config);

    const result = await sql.query`SELECT * FROM Users WHERE UserID = ${id}`;
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }

    // Silme işlemi
    await sql.query`DELETE FROM Users WHERE UserID = ${id}`;
    res.status(200).json({ message: "Kullanıcı başarıyla silindi." });

  } catch (err) {
    console.error("❌ Kullanıcı silme hatası:", err);
    res.status(500).json({ message: "Sunucu hatası." });
  }
});



app.post("/register", async (req, res) => {
  const { firstName, lastName, email, password, phone, address } = req.body;

  console.log("🟢 Gelen veri:", req.body); // BUNU EKLE

  try {
    await sql.connect(config);
    const hashedPassword = await bcrypt.hash(password, 10);

    await sql.query`
      INSERT INTO Users (FirstName, LastName, Email, Password, PhoneNumber, Address)
      VALUES (${firstName}, ${lastName}, ${email}, ${hashedPassword}, ${phone}, ${address})
    `;

    console.log("✅ Kayıt tamamlandı.");
    res.status(201).json({ message: "Kayıt başarılı" });
  } catch (err) {
    console.error("🔴 Kayıt hatası:", err);
    res.status(500).json({ message: "Kayıt sırasında hata oluştu" });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    await sql.connect(config);
    const result = await sql.query`SELECT * FROM Users WHERE Email = ${email}`;
    const user = result.recordset[0];

    if (!user) {
      return res.status(401).json({ message: 'Kullanıcı bulunamadı.' });
    }

    const isMatch = await bcrypt.compare(password, user.Password); // şifre karşılaştır

    if (!isMatch) {
      return res.status(401).json({ message: 'Şifre yanlış.' });
    }

    if (req.url.includes("admin-login") && user.Role !== "admin") {
      return res.status(403).json({ message: "Bu sayfaya yalnızca admin giriş yapabilir." });
    }

    res.status(200).json({ message: 'Giriş başarılı.', user: { id: user.UserID, name: user.FirstName } });
  } catch (err) {
    console.error('Login hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

app.get("/profile/:id", async (req, res) => {
  const userId = req.params.id;
  console.log("📥 Profil isteği geldi. Kullanıcı ID:", userId);

  try {
    await sql.connect(config);
    const result = await sql.query`
      SELECT UserID, FirstName, LastName, Email, PhoneNumber, Address
      FROM Users
      WHERE UserID = ${userId}
    `;

    console.log("✅ SQL sonucu:", result.recordset);

    const user = result.recordset[0];

    if (!user) {
      console.warn("⚠️ Kullanıcı bulunamadı!");
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error("❌ Profil verisi alınamadı:", err);
    res.status(500).json({ message: "Sunucu hatası" });
  }
});

app.post("/api/loan", async (req, res) => {
  const { bookId, userId, adminId = null } = req.body;

  try {
    await sql.connect(config);

    await sql.query`
      INSERT INTO LoanTransaction (
        BookID, UserID, AdminID, LoanDate, ReturnDate, IsApproved
      )
      VALUES (
        ${bookId}, ${userId}, ${adminId}, GETDATE(), NULL, 0
      )
    `;

    res.status(200).json({ message: "Kiralama isteği başarıyla gönderildi. Onay bekleniyor." });
  } catch (err) {
    console.error("Kiralama hatası:", err);
    res.status(500).json({ message: "Kiralama işlemi başarısız." });
  }
});





app.get("/loans/all", async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query(`
      SELECT
        l.LoanID,
        l.BookID,
        l.UserID,
        l.AdminID,
        l.LoanDate,
        l.ReturnDate,
        l.IsApproved,
        bi.BookTitle,
        u.FirstName + ' ' + u.LastName AS UserName
      FROM LoanTransaction l
      JOIN Books b ON l.BookID = b.BookID
      JOIN BookInfo bi ON b.ISBN = bi.ISBN
      JOIN Users u ON l.UserID = u.UserID
      ORDER BY l.LoanDate DESC
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error("Ödünç listeleme hatası:", err);
    res.status(500).json({ message: "Sunucu hatası" });
  }
});





app.get("/loans/user/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    await sql.connect(config);

    const result = await sql.query`
      SELECT 
        l.LoanID,
        l.BookID,
        l.AdminID,
        l.UserID,
        l.LoanDate,
        l.ReturnDate,
        l.IsApproved,
        bi.BookTitle
      FROM LoanTransaction l
      JOIN Books b ON l.BookID = b.BookID
      JOIN BookInfo bi ON b.ISBN = bi.ISBN
      WHERE l.UserID = ${userId}
      ORDER BY l.LoanDate DESC
    `;

    res.json(result.recordset);
  } catch (err) {
    console.error("Kullanıcı ödünç geçmişi hatası:", err);
    res.status(500).json({ message: "Sunucu hatası" });
  }
});

app.get("/admin/:id", async (req, res) => {
  const adminId = req.params.id;

  try {
    await sql.connect(config);
    const result = await sql.query`
      SELECT 
        AdminID,
        FirstName,
        LastName,
        Email,
        PhoneNumber,
        Password
      FROM Admin
      WHERE AdminID = ${adminId}
    `;

    const admin = result.recordset[0];

    if (!admin) {
      return res.status(404).json({ message: "Admin bulunamadı" });
    }

    res.status(200).json(admin);
  } catch (err) {
    console.error("Admin verisi alınamadı:", err);
    res.status(500).json({ message: "Sunucu hatası" });
  }
});


app.post("/admin/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    await sql.connect(config);
    const result = await sql.query`
      SELECT * FROM Admin WHERE Email = ${email} 
    `;
    const admin = result.recordset[0];

    if (!admin) {
      return res.status(401).json({ message: "Admin bulunamadı" });
    }


    if (password !== admin.Password) {
      return res.status(401).json({ message: "Şifre hatalı" });
    }
    console.log("🟡 Gelen şifre:", password);
    console.log("🟢 DB'den gelen şifre:", admin.Password);


    res.status(200).json({
      message: "Giriş başarılı",
      admin: { id: admin.AdminID, email: admin.Email, name: admin.FirstName + " " + admin.LastName }
    });
  } catch (err) {
    console.error("Admin giriş hatası:", err);
    res.status(500).json({ message: "Sunucu hatası" });
  }
});

app.post("/loans/approve/:loanId", async (req, res) => {
  const { loanId } = req.params;
  const { adminId } = req.body;

  if (!adminId) {
    return res.status(400).json({ message: "Admin ID zorunludur." });
  }

  try {
    await sql.connect(config);

    const result = await sql.query`
      UPDATE LoanTransaction
      SET IsApproved = 1,
          AdminID = ${adminId}
      WHERE LoanID = ${loanId} AND IsApproved = 0
    `;

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Onay bekleyen kayıt bulunamadı." });
    }

    res.status(200).json({ message: "Ödünç başarıyla onaylandı." });
  } catch (err) {
    console.error("Onay hatası:", err);
    res.status(500).json({ message: "Sunucu hatası" });
  }
});



app.post("/loans/return/:loanId", async (req, res) => {
  const { loanId } = req.params;

  try {
    await sql.connect(config);

    const result = await sql.query`
      UPDATE LoanTransaction
      SET ReturnDate = GETDATE()
      WHERE LoanID = ${loanId} AND ReturnDate IS NULL
    `;

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "İade edilecek kayıt bulunamadı." });
    }

    res.status(200).json({ message: "Kitap başarıyla iade edildi." });
  } catch (err) {
    console.error("İade hatası:", err);
    res.status(500).json({ message: "Sunucu hatası" });
  }
});







// backend/index.js ya da route dosyan


app.post("/punishments/give", async (req, res) => {
  const { userId, adminId, punishmentId } = req.body;

  if (!userId || !adminId || !punishmentId) {
    return res.status(400).json({ message: "Tüm alanlar zorunludur." });
  }

  try {
    const pool = await sql.connect(config);

    const result = await pool.request()
      .input("UserID", sql.Int, userId)
      .input("AdminID", sql.Int, adminId)
      .input("PunishmentID", sql.Int, punishmentId)
      .execute("GivePunishment"); 

    res.status(200).json({ message: "Ceza başarıyla verildi." });
  } catch (err) {
    console.error("Ceza verme hatası:", err);
    res.status(500).json({ message: "Sunucu hatası" });
  }
});



app.get("/punishments/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    await sql.connect(config);

    const result = await sql.query`
      SELECT 
        pg.PunishmentID,
        pg.AdminID,
        pg.UserID,
        CONVERT(varchar, pg.DateGiven, 120) AS DateGiven
      FROM PunishmentGiven pg
      WHERE pg.UserID = ${userId}
      ORDER BY pg.DateGiven DESC
    `;

    res.json(result.recordset);
  } catch (err) {
    console.error("Ceza listeleme hatası:", err);
    res.status(500).json({ message: "Sunucu hatası" });
  }
});

app.listen(port, () => {
  console.log(`Server ${port} portunda çalışıyor.`);
});