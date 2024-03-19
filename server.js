const express = require('express');
const bodyParser = require('body-parser');
const pg = require('pg');
const session = require('express-session');
const fs = require('fs');
const xlsx = require('xlsx');
const Docxtemplater = require('docxtemplater');
const { Document, Packer, Paragraph } = require('docx');

const multer = require('multer');
// const xlsx = require('xlsx');


const path = require('path');




// Assuming you have configured your pool variable for database connection

// Set up multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const pool = new pg.Pool({
    user: "postgres",
    host: "localhost",
    database: "quiz",
    password: "123456",
    port: 5432,
});







async function getSubjects() {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT DISTINCT subject FROM your_table_name');
        client.release(); // Release the client back to the pool when done

        return result.rows.map(row => row.subject);
    } catch (err) {
        console.error('Error executing query', err.stack);
        throw err; // Rethrow the error to be caught by the calling function
    }
}

var teacherName;

async function getQuizData(subject) {
    try {
        const client = await pool.connect();
        const result = await client.query(`SELECT * FROM ${subject}`);
        client.release(); // Release the client back to the pool when done

        return result.rows;
    } catch (err) {
        console.error('Error executing query', err.stack);
        throw err; // Rethrow the error to be caught by the calling function
    }
}


const flag = 0;

const app = express();
const port = 5000;
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('./intro'));

app.set('view engine', 'ejs');
app.use(express.static('public'));


app.get('/', (req, res) => {
    res.sendFile(__dirname + '/intro/intro.html');
});



app.post('/download-template', (req, res) => {
    try {
        const worksheet = xlsx.utils.aoa_to_sheet([['question', 'optionA', 'optionB', 'optionC', 'optionD', 'correctOption', 'topic']]);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, 'template');

        // Set the response headers for Excel download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=template.xlsx');

        // Create a buffer for writing the workbook
        const buffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });

        // Send the buffer as the response
        res.send(buffer);

    } catch (err) {
        console.error('Error in /download-template route:', err.stack);
        res.status(500).send('Internal Server Error: ' + err.message);
    }
});



app.post('/download-template-word', (req, res) => {
    try {
        const docxDocument = doc(
            p('Question: _________'),
            p('Option A: _________'),
            p('Option B: _________'),
            p('Option C: _________'),
            p('Option D: _________'),
            p('Correct Option: _________'),
            p('Topic: _________')
        );

        // Convert the document to a buffer
        const buffer = docx.Packer.toBuffer(docxDocument);

        // Set the response headers for Word download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', 'attachment; filename=template.docx');

        // Send the buffer as the response
        res.send(buffer);

    } catch (err) {
        console.error('Error in /download-template route:', err.stack);
        res.status(500).send('Internal Server Error: ' + err.message);
    }
});


app.post('/add-teacher', async (req, res) => {
    try {
        const { teachername, teacherSubject, teacherEmail, teacherPassword } = req.body;

        const result = await pool.query(`
            INSERT INTO teachers (name, subject, email, password)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (email) DO UPDATE 
            SET name = $1, subject = $2, password = $4
            RETURNING *
        `, [teachername, teacherSubject, teacherEmail, teacherPassword]);

        res.send("<h1 style='position: absolute;top:2%;left:40%;background-color: #c6dbff; padding: 20px; border-radius: 10px; box-shadow: 1px 1px 10px #30588e;'>" + "Teacher added successfully!" + "</h1>");
    } catch (err) {
        console.error('Error in /add-teacher route:', err.stack);
        res.status(500).send('Internal Server Error: ' + err.message);
    }
});


app.post('/add-student', async (req, res) => {
    try {
        const { studentName, studentGrade, studentEmail, studentPassword } = req.body;

        const result = await pool.query(`
            INSERT INTO students (name, grade, email, password)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (email) DO UPDATE 
            SET name = $1, grade = $2, password = $4
            RETURNING *
        `, [studentName, studentGrade, studentEmail, studentPassword]);

        res.send("<h1 style='position: absolute;top:2%;left:40%;background-color: #c6dbff; padding: 20px; border-radius: 10px; box-shadow: 1px 1px 10px #30588e;  '>" + 'Student added successfully!' + "</h1>");
    } catch (err) {
        console.error('Error in /add-student route:', err.stack);
        res.status(500).send('Internal Server Error: ' + err.message);
    }
});

const admins = [
    { username: 'admin', password: 'admin123' },
    { username: 'admin2', password: 'admin234' }
];

app.post('/admin', (req, res) => {
    res.render(__dirname + '/intro/adminlogin.ejs');
});

app.post('/adminlogin', (req, res) => {
    const { username, password } = req.body;
    const admin = admins.find(u => u.username === username && u.password === password);

    if (admin) {
        res.render(__dirname + '/intro/admin.ejs');
    } else {
        res.send("<h1 style='position: absolute;top:2%;left:40%;background-color: #c6dbff; padding: 20px; border-radius: 10px; box-shadow: 1px 1px 10px #30588e;  '>" + 'Invalid credentials. Please try again.' + "</h1>");
    }
});

app.post('/topic', async (req, res) => {
    try {
        const { quizName, start, end, question, optionA, optionB, optionC, optionD, correctOption } = req.body;
        console.log(req.body);

        const result = await pool.query(`
            INSERT INTO ${teachersub} (question, optiona, optionb, optionc, optiond, correctanswer, starttime, endtime)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [question, optionA, optionB, optionC, optionD, correctOption, start, end]);

        res.send("<h1 style='position: absolute;top:2%;left:40%;background-color: #c6dbff; padding: 20px; border-radius: 10px; box-shadow: 1px 1px 10px #30588e;  '>" + 'Quiz saved successfully!' + "</h1>");
    } catch (err) {
        console.error('Error in /topic route:', err.stack);
        res.status(500).send('Internal Server Error: ' + err.message);
    }
});

app.post('/login', (req, res) => {
    app.use(express.static('./intro/login'));
    res.sendFile(__dirname + '/intro/login/login.html');

});
var teachersub;

app.use(session({
    secret: '12345',
    resave: true,
    saveUninitialized: true
}));

app.post('/teacherlogin', async (req, res) => {
    try {
        const { email, password } = req.body;

        const result = await pool.query('SELECT * FROM teachers WHERE email = $1 AND password = $2', [email, password]);

        if (result.rows.length > 0) {
            const professor = result.rows[0];

            // Store teacherName in session
            teacherName = professor.name;
            // console.log(teacherName);

            // Static folder middleware should be set globally, not within a route
            app.use(express.static('./intro/login/teacher'));

            // Render your EJS template with professor data
            res.render(__dirname + "/intro/login/teacher/sections.ejs", { professor: professor });
        } else {
            res.send("<h1 style='position: absolute;top:2%;left:40%;background-color: #c6dbff; padding: 20px; border-radius: 10px; box-shadow: 1px 1px 10px #30588e;  '>" + 'Invalid email or password for teacher login' + "</h1>");
        }
    } catch (err) {
        console.error('Error in /teacherlogin route:', err.stack);
        res.status(500).send('Internal Server Error: ' + err.message);
    }
});

var sec;
app.post('/csa', (req, res) => {
    sec = 'csa'; // Store section value in the session
    res.render(__dirname + "/hi.ejs");
});

app.post('/csb', (req, res) => {
    sec = 'csb';
    res.render(__dirname + "/hi.ejs");
});

app.post('/csc', (req, res) => {
    sec = 'csc';
    res.render(__dirname + "/hi.ejs");
});

app.post('/csd', (req, res) => {
    sec = 'csd';
    res.render(__dirname + "/hi.ejs");
});



app.post('/addQuiza', (req, res) => {
    app.use(express.static('./intro/login/teacher/dashboard/addquiz'));
    res.sendFile(__dirname + '/intro/login//teacher/dashboard/addquiz/addquiza.html');

});
app.post('/addQuizb', (req, res) => {
    app.use(express.static('./intro/login/teacher/dashboard/addquiz'));
    res.sendFile(__dirname + '/intro/login//teacher/dashboard/addquiz/addquiza.html');

});
app.post('/addQuizc', (req, res) => {
    app.use(express.static('./intro/login/teacher/dashboard/addquiz'));
    res.sendFile(__dirname + '/intro/login//teacher/dashboard/addquiz/addquiza.html');

});
app.post('/addQuizd', (req, res) => {
    app.use(express.static('./intro/login/teacher/dashboard/addquiz'));
    res.sendFile(__dirname + '/intro/login//teacher/dashboard/addquiz/addquiza.html');

});



app.post('/startQuiza', (req, res) => {

    app.use('/manageQuiz', express.static('./intro/login/teacher/managequiz'));
    res.render(path.join(__dirname, 'intro', 'login', 'teacher', 'managequiz', 'managequiz.ejs'), { subjects: subjects });
});

app.post('/studentd', async (req, res) => {
    try {
        const { email, password } = req.body;


        const result = await pool.query('SELECT * FROM students WHERE email = $1 AND password = $2', [email, password]);

        if (result.rows.length > 0) {

            const user = result.rows[0];

            const questions = await getQuizData();
            const subjects = [...new Set(questions.map(question => question.subject))];

            res.render(path.join(__dirname, 'intro', 'login', 'student', 'quizselect.ejs'), {
                subjects: subjects,
                questions: JSON.stringify(questions),
                user: user
            });
        } else {

            res.send("<h1 style='position: absolute;top:2%;left:40%;background-color: #c6dbff; padding: 20px; border-radius: 10px; box-shadow: 1px 1px 10px #30588e;  '>" + 'Invalid email or password for student login') + "</h1>";
        }
    } catch (err) {
        console.error('Error in /studentlogin route:', err.stack);
        res.status(500).send('Internal Server Error: ' + err.message);
    }
});


var studentName;
var studentSection;

app.post('/student', async (req, res) => {
    try {
        const { email, password } = req.body;

        const userResult = await pool.query('SELECT * FROM students WHERE email = $1 AND password = $2', [email, password]);

        if (userResult.rows.length > 0) {
            if (userResult.rows[0].password === "rvce123") {
                // First-time login, prompt for password change
                res.render(__dirname + '/intro/login/student/change.ejs', {
                    email: email,
                    currentPassword: password
                });
            } else {
                // Regular login
                studentName = userResult.rows[0].name;
                studentSection = userResult.rows[0].grade;

                // res.render(__dirname + '/intro/login/student/sample.ejs');
                res.redirect("/ava_student");
            }
        } else {
            res.send("<h1 style='position: absolute;top:2%;left:40%;background-color: #c6dbff; padding: 20px; border-radius: 10px; box-shadow: 1px 1px 10px #30588e;  '>" + 'Invalid email or password for student login' + "</h1>");
        }
    } catch (err) {
        console.error('Error in /student route:', err.stack);
        res.status(500).send('Internal Server Error: ' + err.message);
    }
});


app.post('/update-password', async (req, res) => {
    try {
        const { email, currentPassword, newPassword } = req.body;

        // Validate the current password before updating
        const userResult = await pool.query('SELECT * FROM students WHERE email = $1 AND password = $2', [email, currentPassword]);

        if (userResult.rows.length > 0) {
            // Update the password in the database
            await pool.query('UPDATE students SET password = $1 WHERE email = $2', [newPassword, email]);
            res.send("<h1 style='position: absolute;top:2%;left:40%;background-color: #c6dbff; padding: 20px; border-radius: 10px; box-shadow: 1px 1px 10px #30588e;  '>" + 'Password Changed Successfully>' + "</h1>");

        } else {
            res.send("<h1>Invalid current password</h1>");
        }
    } catch (err) {
        console.error('Error in /update-password route:', err.stack);
        res.status(500).send('Internal Server Error: ' + err.message);
    }
});


async function getdata(sub) {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT * FROM ' + sub);
        client.release();

        return result.rows;
    } catch (err) {
        console.error('Error executing query', err.stack);
        throw err;
    }
}
var chosensub;
app.post('/new', async (req, res) => {
    chosensub = req.body.subjectSelect;

    try {
        questionlist = await getdata(chosensub);
        let start = questionlist[0].starttime;
        let end = questionlist[0].endtime;
        let current = new Date();



        if (end > current && start < current) {
            const stuResult = await pool.query('SELECT * FROM student_results WHERE student_name = $1 AND subject = $2', [studentName, chosensub]);
            if (stuResult.rows.length > 0) {
                res.send("<h1 style='position: absolute;top:2%;left:40%;background-color: #c6dbff; padding: 20px; border-radius: 10px; box-shadow: 1px 1px 10px #30588e;  '>" + "You have already attempted this quiz." + "</h1>");
            }
            else {
                res.render(__dirname + '/intro/login/student/sampledisplay.ejs', { questionlist });
            }
        } else {
            res.send("<h1 style='position: absolute;top:2%;left:40%;background-color: #c6dbff; padding: 20px; border-radius: 10px; box-shadow: 1px 1px 10px #30588e;  '>" + "Quiz is not available at this time." + "</h1>");
        }
    } catch (error) {
        res.send("<h1 style='position: absolute;top:2%;left:40%;background-color: #c6dbff; padding: 20px; border-radius: 10px; box-shadow: 1px 1px 10px #30588e;  '>" + "Quiz not available please refresh after going back" + "</h1>");
        res.status(500).send('Internal Server Error');
    }
});


function check(question) {
    if (question.correctanswer === 'a') { return question.optiona }
    if (question.correctanswer === 'b') { return question.optionb }
    if (question.correctanswer === 'c') { return question.optionc }
    if (question.correctanswer === 'd') { return question.optiond }
}

app.post('/submit', (req, res) => {
    const submittedAnswers = req.body;
    let totalMarks = 0;

    // Assuming your questionlist contains correct answers in the correctanswer property
    questionlist.forEach((question, index) => {


        let correctAnswer = check(question);

        // Check if the submitted answer matches the correct answer

        if (submittedAnswers[`answer${index}`] === correctAnswer) {
            totalMarks++;
        }
    });


    pool.query(`
    INSERT INTO student_results (student_name, subject, total_marks,section)
    VALUES ($1, $2, $3, $4)
`, [studentName, chosensub, totalMarks, section]);

    res.render(__dirname + '/intro/login/student/sample.ejs');
});




app.post('/show', async (req, res) => {
    chosensub = req.body.subjectSelect;
    try {




        const stuResult = await pool.query('SELECT * FROM student_results WHERE student_name = $1 AND subject = $2', [studentName, chosensub]);
        if (stuResult.rows.length > 0) {
            res.send("<h1 style='position: absolute;top:2%;left:40%;background-color: #c6dbff; padding: 20px; border-radius: 10px; box-shadow: 1px 1px 10px #30588e;  '>" + "Your score is     " + stuResult.rows[0].total_marks + "</h1>");
        }
        else {
            res.send("<h1 style='position: absolute;top:2%;left:40%;background-color: #c6dbff; padding: 20px; border-radius: 10px; box-shadow: 1px 1px 10px #30588e;  '>" + "Not available.Please refreshafter going back.." + "</h1>")
        }



    } catch (error) {
        console.error('Error getting data:', error);
        res.status(500).send('Internal Server Error');
    }
});



app.post('/scorea', async (req, res) => {
    res.render(path.join(__dirname, 'intro', 'login', 'teacher', 'score', 'a.ejs'));
});



// app.post('/resulta',async(req,res)=>{
//     subb = req.body.subjectSelect;

//     try {
//         const client = await pool.connect();
//         const result = await client.query('SELECT student_name, total_marks FROM student_results WHERE section = $1 AND subject = $2', ['cse a', subb]);

//         client.release(); // Release the client back to the pool when done

//         var students= result.rows;
//     } catch (err) {
//         console.error('Error executing query', err.stack);
//         throw err; // Rethrow the error to be caught by the calling function
//     }
// console.log(students);

//     res.render(path.join(__dirname, 'intro', 'login', 'teacher', 'score', 'scorea.ejs'),{subject:subb,section:sec,students});
// });



const excel = require('exceljs');
var subb;
var students;
app.post('/resulta', async (req, res) => {
    subb = req.body.subjectSelect;

    try {
        const client = await pool.connect();
        const result = await client.query('SELECT student_name, total_marks FROM student_results WHERE section = $1 AND subject = $2', [sec, subb]);

        client.release();

        students = result.rows;

        // Generate Excel file
        const workbook = new excel.Workbook();
        const worksheet = workbook.addWorksheet('Results');

        // Add headers
        worksheet.addRow(['Student Name', 'Total Marks']);

        // Add data
        students.forEach(student => {
            worksheet.addRow([student.student_name, student.total_marks]);
        });

        // Create a unique filename based on timestamp
        const filename = `results_${Date.now()}.xlsx`;

        // Save the workbook to a file
        await workbook.xlsx.writeFile(filename);

        // Render the confirmation page
        res.render(__dirname + '/confirm.ejs', { filename });
    } catch (err) {
        console.error('Error executing query', err.stack);
        res.status(500).send('Internal Server Error');
    }
});

// Handle the download and view options
app.get('/download-excel', (req, res) => {
    const filename = req.query.filename; // Get the filename from the query parameters

    // Send the Excel file as a download
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.render(path.join(__dirname, 'intro', 'login', 'teacher', 'score', 'scorea.ejs'), { subject: subb, section: sec, students });


});

app.get('/view-on-website', (req, res) => {
    const filename = req.query.filename; // Get the filename from the query parameters

    // Render the EJS template
    res.render(path.join(__dirname, 'intro', 'login', 'teacher', 'score', 'scorea.ejs'), { subject: subb, section: sec, students });

});



app.post('/resultall', async (req, res) => {
    subb = req.body.subjectSelect;
    section = req.body.section;

    try {
        const client = await pool.connect();
        const result = await client.query('SELECT student_name, total_marks FROM student_results WHERE section = $1 AND subject = $2', [section, subb]);

        client.release(); // Release the client back to the pool when done

        var students = result.rows;
    } catch (err) {
        console.error('Error executing query', err.stack);
        throw err; // Rethrow the error to be caught by the calling function
    }


    res.render(path.join(__dirname, 'intro', 'login', 'teacher', 'score', 'scorea.ejs'), { subject: subb, section: section, students });
});


app.post('/deleteall', async (req, res) => {
    const subject = req.body.subjectSelect;
    const section = req.body.section;

    try {
        const client = await pool.connect();

        // Delete rows from the database based on the selected subject and section
        const deleteQuery = 'DELETE FROM student_results WHERE subject = $1 AND section = $2';
        await client.query(deleteQuery, [subject, section]);

        client.release(); // Release the client back to the pool when done

        res.send("<h1 style='position: absolute;top:2%;left:40%;background-color: #c6dbff; padding: 20px; border-radius: 10px; box-shadow: 1px 1px 10px #30588e;  '>" + 'Rows deleted successfully!' + "</h1>");
    } catch (err) {
        console.error('Error in /deleteall route:', err.stack);
        res.status(500).send('Internal Server Error: ' + err.message);
    }
});

app.post('/deletequiz', async (req, res) => {
    const subject = req.body.subjectSelect;


    try {
        const client = await pool.connect();

        // Delete rows from the database based on the selected subject and section
        const deleteQuery = `DELETE FROM ${subject}`;
        await client.query(deleteQuery);

        client.release(); // Release the client back to the pool when done

        res.send("<h1 style='position: absolute;top:2%;left:40%;background-color: #c6dbff; padding: 20px; border-radius: 10px; box-shadow: 1px 1px 10px #30588e;  '>" + 'Quiz deleted successfully!' + "</h1>");
    } catch (err) {
        console.error('Error in /deleteall route:', err.stack);
        res.status(500).send('Internal Server Error: ' + err.message);
    }
});
















// app.post('/addquizz', (req, res) => {
//     const filePath = path.join(__dirname, 'hi.html');
//     res.sendFile(filePath);
// });

// app.post('/savequizz', upload.single('file'), async (req, res) => {
//     try {

//         const { buffer } = req.file; // Access the buffer of the uploaded file

//         // Parse Excel data
//         const workbook = xlsx.read(buffer, { type: 'buffer' });
//         const sheetName = workbook.SheetNames[0];
//         const sheet = workbook.Sheets[sheetName];
//         const data = xlsx.utils.sheet_to_json(sheet);

//         // Iterate over the rows in the Excel file and insert into the database
//         for (const row of data) {
//             const { question, optionA, optionB, optionC, optionD, correctOption ,start,end} = row;
//             await pool.query(`
//                 INSERT INTO maths (subject, question, optiona, optionb, optionc, optiond, correctanswer, starttime, endtime)
//                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
//             `, [topic, question, optionA, optionB, optionC, optionD, correctOption, start, end]);
//         }

//         res.send("<h1 style='position: absolute;top:2%;left:40%;background-color: #c6dbff; padding: 20px; border-radius: 10px; box-shadow: 1px 1px 10px #30588e;  '>"+'Quiz saved successfully!'+"</h1>");
//     } catch (err) {
//         console.error('Error in /topic route:', err.stack);
//         res.status(500).send('Internal Server Error: ' + err.message);
//     }
// });






/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////new changes//////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////





app.get('/hi', (req, res) => {
    const filePath = path.join(__dirname, 'hi.html');
    res.sendFile(filePath);
});

app.post('/saveqizz', upload.single('file'), async (req, res) => {
    try {
        const { buffer } = req.file;

        const workbook = xlsx.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        // Assuming you have teacher and section information in your request, update accordingly
        // teacherName = teacherName;
        // section = section;
        const tableName = `${teacherName}_${sec}`;

        // Create a new table dynamically if it doesn't exist
        await pool.query(`
            CREATE TABLE IF NOT EXISTS ${tableName} (
                subject VARCHAR(255),
                question VARCHAR(255) UNIQUE, -- Adding UNIQUE constraint on question
                optiona VARCHAR(255),
                optionb VARCHAR(255),
                optionc VARCHAR(255),
                optiond VARCHAR(255),
                correctanswer VARCHAR(255),
                topic VARCHAR(255)
            )
        `);

        // Insert data into the dynamically created table
        for (const row of data) {
            const { question, optionA, optionB, optionC, optionD, correctOption, topic } = row;
            await pool.query(`
                INSERT INTO ${tableName} ( question, optiona, optionb, optionc, optiond, correctanswer,topic)
                VALUES ($1, $2, $3, $4, $5, $6,$7)
                ON CONFLICT (question) DO NOTHING; -- Ignore if the question already exists
            `, [question, optionA, optionB, optionC, optionD, correctOption, topic]);
        }

        res.send("<h1 style='position: absolute;top:2%;left:40%;background-color: #c6dbff; padding: 20px; border-radius: 10px; box-shadow: 1px 1px 10px #30588e;  '>" + 'Quiz saved successfully!' + "</h1>");
    } catch (err) {
        console.error('Error in /topic route:', err.stack);
        res.status(500).send('Internal Server Error: ' + err.message);
    }
});






app.get('/ava', async (req, res) => {
    try {

        // teacherNameconst  = teacherName;
        // const section = section;
        const tableName = `${teacherName}_${sec}`;

        const result = await pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_name LIKE $1;
`, [`${teacherName}%`]);



        const quizzes = result.rows.map(row => row.table_name);


        res.render(__dirname + '/availablequizzes.ejs', { quizzes });
    } catch (err) {
        console.error('Error in /ava route:', err.stack);
        res.status(500).send('Internal Server Error: ' + err.message);
    }
});


var quiname;

// app.get('/viewquiz/:quizName', async (req, res) => {
//     try {

//         quiname = req.params.quizName;
//         console.log(quiname);
//         const result = await pool.query(`
//             SELECT *
//             FROM ${quiname};  -- Adjust the query based on your table structure
//         `);

//         const quizDetails = result.rows;

//         res.render(__dirname + '/viewquiz.ejs', { quizDetails });
//     } catch (err) {
//         console.error('Error in /viewquiz route:', err.stack);
//         res.status(500).send('Internal Server Error: ' + err.message);
//     }
// });

app.get('/viewquiz/:quizName/:topic', async (req, res) => {
    try {
        const quizName = req.params.quizName;
        quiname = req.params.quizName;
        const topic = req.params.topic;
        console.log(quizName, topic);

        // Fetch questions related to the specified topic from your database
        // Adjust the query based on your table structure
        const result = await pool.query(`
            SELECT *
            FROM ${quizName}
            WHERE topic = $1;
        `, [topic]);

        const quizDetails = result.rows;

        res.render(__dirname + '/viewquiz.ejs', { quizDetails });
    } catch (err) {
        console.error('Error in /viewquiz/:quizName/:topic route:', err.stack);
        res.status(500).send('Internal Server Error: ' + err.message);
    }
});



app.get('/availabletopics/:quizName', async (req, res) => {
    try {
        const quizName = req.params.quizName;
        console.log(quizName);

        // Assuming you have some mechanism to fetch topics for the quiz from your database
        // Replace this query with your actual database query to fetch distinct topics for the specified quiz
        const result = await pool.query(`
            SELECT DISTINCT topic
            FROM ${quizName};  -- Adjust the query based on your table structure
        `);

        const topics = result.rows.map(row => row.topic);

        res.render(__dirname + '/availabletopics.ejs', { quizName, topics });
    } catch (err) {
        console.error('Error in /availabletopics route:', err.stack);
        res.status(500).send('Internal Server Error: ' + err.message);
    }
});



app.get('/deletequiz/:quizName', async (req, res) => {
    try {
        const quizName = req.params.quizName;


        await pool.query(`
            DROP TABLE IF EXISTS ${quizName};
        `);
        const deleteQuery = 'DELETE FROM timings WHERE quiz_name = $1';
        const values = [quizName];
        await pool.query(`
        SELECT score
        FROM quiz_results
        WHERE quiz_name = $1;
    `, [quizName]);
        await pool.query(`
    DELETE FROM quiz_results
    WHERE quiz_name = $1;
    `, [quizName]);
        await pool.query(`
    DELETE FROM quiz_attempts
    WHERE quiz_name = $1;
    `, [quizName]);

        try {
            const result = await pool.query(deleteQuery, values);
            console.log('Row deleted successfully');
        } catch (error) {
            console.error('Error deleting row:', error);
        }


        res.redirect('/ava');
    } catch (err) {
        console.error('Error in /deletequiz route:', err.stack);
        res.status(500).send('Internal Server Error: ' + err.message);
    }
});


// Example Express route for handling quiz update and redirection
app.post('/updatequiz/:question', express.json(), async (req, res) => {
    try {
        const questionToUpdate = req.params.question;
        const formData = req.body;
        const table_name = quiname;

        // Check if the new question value already exists
        const checkExistingQuery = `SELECT 1 FROM ${table_name} WHERE question = $1 AND question != $2 LIMIT 1;`;
        const checkExistingResult = await pool.query(checkExistingQuery, [formData.question, questionToUpdate]);

        res.setHeader('Content-Type', 'application/json');

        if (checkExistingResult.rows.length === 0) {
            // If the new question value is unique, proceed with the update
            const updateQuery = `
                UPDATE ${table_name}
                SET
                    question = $1,
                    optiona = $2,
                    optionb = $3,
                    optionc = $4,
                    optiond = $5,
                    correctanswer = $6
                WHERE
                    question = $7;
            `;

            await pool.query(updateQuery, [
                formData.question,
                formData.optiona,
                formData.optionb,
                formData.optionc,
                formData.optiond,
                formData.correctOption,
                questionToUpdate
            ]);

            res.json({ success: true, message: 'Question updated successfully.' });
        } else {
            res.status(400).json({ success: false, message: 'New question value already exists.' });
        }
    } catch (err) {
        console.error('Error in /updatequiz route:', err.stack);

        // Return a more generic error message to the client
        res.status(500).json({ success: false, message: 'Internal Server Error: Unable to update the question.' });
    }
});

app.get('/fetchquiz/:question', async (req, res) => {
    try {
        const questionToFetch = req.params.question;
        const table_name = quiname;

        // Fetch the quiz details for the specified question
        const fetchQuery = `SELECT * FROM ${table_name} WHERE question = $1;`;
        const fetchResult = await pool.query(fetchQuery, [questionToFetch]);

        if (fetchResult.rows.length === 0) {
            // If the question does not exist, return an error response
            res.status(404).json({ success: false, message: 'Question not found.' });
        } else {
            // If the question exists, return the quiz details
            const quizDetails = fetchResult.rows[0];
            res.json({ success: true, quizDetails });
        }
    } catch (err) {
        console.error('Error in /fetchquiz route:', err.stack);

        // Return a more generic error message to the client
        res.status(500).json({ success: false, message: 'Internal Server Error: Unable to fetch quiz details.' });
    }
});

app.post('/deletequestion/:question', async (req, res) => {
    try {
        console.error("hello");
        const questionToDelete = req.params.question;
        // const section = sec;
        // const teacherName = teacherName;
        console.log(questionToDelete);
        // Perform the deletion in your database
        const deleteQuery = `DELETE FROM ${quiname} WHERE question = $1;`;
        await pool.query(deleteQuery, [questionToDelete]);

        // Set the Content-Type header to indicate that the response is in JSON format
        res.setHeader('Content-Type', 'application/json');

        // Send a success response as a JSON object
        res.json({ success: true, message: 'Question deleted successfully.' });
    } catch (err) {
        console.error('Error in /deletequiz route:', err.stack);
        res.status(500).json({ success: false, message: 'Internal Server Error: ' + err.message });
    }
});



app.post('/updatetime/:question', express.json(), async (req, res) => {
    try {
        const questionToUpdate = req.params.question;
        const formData = req.body;
        console.log(questionToUpdate);
        console.log(formData);
        // Assuming you have a database update query here
        // Adjust the query based on your actual database schema

        // Check if the quiz already exists in the 'timings' table
        const checkExistingQuery = 'SELECT 1 FROM timings WHERE quiz_name = $1 LIMIT 1;';
        const checkExistingResult = await pool.query(checkExistingQuery, [questionToUpdate]);

        if (checkExistingResult.rows.length > 0) {
            // If the quiz exists, update the row
            const updateQuery = `
                UPDATE timings
                SET
                    start_time = $1,
                    end_time = $2
                WHERE
                    quiz_name = $3;
            `;

            await pool.query(updateQuery, [formData.startTime, formData.endTime, questionToUpdate]);
        } else {
            // If the quiz does not exist, you can choose to handle it in any way you prefer.
            // For example, you can insert a new row or log a message.
            const insertQuery = `
                INSERT INTO timings (quiz_name, start_time, end_time)
                VALUES ($1, $2, $3);
            `;

            await pool.query(insertQuery, [questionToUpdate, formData.startTime, formData.endTime]);
        }

        res.redirect("/ava");
    } catch (err) {
        console.error('Error in /updatequiz route:', err.stack);
        res.status(500).json({ success: false, message: 'Internal Server Error: ' + err.message });
    }
});


const convertToTimestamp = (time) => {
    const [hours, minutes] = time.split(':');
    const formattedTime = new Date().toISOString().slice(0, 10); // Get current date in 'YYYY-MM-DD' format
    const timestamp = `${formattedTime} ${hours}:${minutes}:00`;
    return timestamp;
};




app.post('/timings', async (req, res) => {
    const quizName = req.body.quizName;
    const startTime = convertToTimestamp(req.body['startTime_' + quizName]);
    const endTime = convertToTimestamp(req.body['endTime_' + quizName]);

    try {
        // Check if the quiz already exists in the database
        const checkExistingQuery = `
            SELECT COUNT(*) AS count
            FROM timings
            WHERE quiz_name = $1
        `;

        const existingResult = await pool.query(checkExistingQuery, [quizName]);

        if (existingResult.rows[0].count > 0) {
            // Quiz exists, perform update
            const updateQuery = `
                UPDATE timings
                SET start_time = $1, end_time = $2
                WHERE quiz_name = $3
            `;

            // Execute the update query
            const updateResult = await pool.query(updateQuery, [startTime, endTime, quizName]);

            if (updateResult.rowCount > 0) {
                res.redirect('/ava');
            } else {
                res.status(500).send('Failed to update quiz');
            }
        } else {
            // Quiz does not exist, perform insert
            const insertQuery = `
                INSERT INTO timings (quiz_name, start_time, end_time)
                VALUES ($1, $2, $3)
            `;

            // Execute the insert query
            const insertResult = await pool.query(insertQuery, [quizName, startTime, endTime]);

            if (insertResult.rowCount > 0) {
                res.redirect('/ava');
            } else {
                res.status(500).send('Failed to add quiz');
            }
        }
    } catch (error) {
        console.error('Error updating or adding quiz:', error);
        res.status(500).send('Internal Server Error');
    }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////

app.get('/ava_student', async (req, res) => {
    try {
        // const section = sec;
        // const teacherName = teacherName;

        const tableName = `${teacherName}_${sec}`;
        const result = await pool.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_name LIKE $1;
        `, [`%${studentSection}%`]);

        const quizzes = result.rows.map(row => ({ name: row.table_name }));

        res.render(__dirname + '/avaquizzesforstudent.ejs', { quizzes });
    } catch (err) {
        console.error('Error in /ava_student route:', err.stack);
        res.status(500).send('Internal Server Error: ' + err.message);
    }
});



app.get('/viewscore/:quizName', async (req, res) => {
    try {
        const quizName = req.params.quizName;

        // Replace 'student_name' with actual student identifier (you may get it from session or other means)


        const result = await pool.query(`
            SELECT score
            FROM quiz_results
            WHERE student_name = $1 AND quiz_name = $2;
        `, [studentName, quizName]);

        if (result.rows.length > 0) {
            const score = result.rows[0].score;
            res.render(__dirname + '/viewcscore.ejs', { quizName, score });
        } else {
            res.send('No score available for this quiz.');
        }
    } catch (err) {
        console.error('Error in /viewscore route:', err.stack);
        res.status(500).send('Internal Server Error: ' + err.message);
    }
});



app.post('/attemptquiz', async (req, res) => {
    try {

        const quizName = req.body.quizName;

        const existingRecord = await pool.query(`
            SELECT 1
            FROM quiz_attempts
            WHERE student_name = $1 AND quiz_name = $2;
        `, [studentName, quizName]);

        if (existingRecord.rows.length === 0) {
            const timingsResult = await pool.query(`
                SELECT start_time, end_time
                FROM timings
                WHERE quiz_name = $1;
            `, [quizName]);

            if (timingsResult.rows.length > 0) {
                const { start_time, end_time } = timingsResult.rows[0];
                const currentTime = new Date();
                const startTime = new Date(start_time);
                const endTime = new Date(end_time);

                if (currentTime >= startTime && currentTime <= endTime) {
                    await pool.query(`
                        INSERT INTO quiz_attempts (student_name, quiz_name)
                        VALUES ($1, $2);
                    `, [studentName, quizName]);

                    res.redirect(`/quiz/${quizName}`);
                } else {
                    res.send('Quiz attempt not allowed at this time.');
                }
            } else {
                res.send('Quiz not found in timings.');
            }
        } else {
            res.send('You have already recorded an attempt for this quiz.');
        }
    } catch (err) {
        console.error('Error in /attemptquiz route:', err.stack);
        res.status(500).send('Internal Server Error: ' + err.message);
    }
});

app.get('/quiz/:quizId', async (req, res) => {
    try {
        const quizId = req.params.quizId;

        const query = `
            SELECT *
            FROM ${quizId};
        `;

        const result = await pool.query(query);
        const questions = result.rows;
        res.render(__dirname + '/displayquiz.ejs', { questions, quizId });
    } catch (err) {
        console.error('Error in /quiz route:', err.stack);
        res.status(500).send('Internal Server Error: ' + err.message);
    }
});


app.post('/submitquiz', async (req, res) => {
    try {

        const quizName = req.body.quizName;
        const answers = req.body;

        console.log(quizName);

        const result = await pool.query(`
            SELECT optionA, optionB, optionC, optionD
            FROM ${quizName};
        `);

        const correctAnswers = result.rows;

        let score = 0;
        for (let i = 0; i < correctAnswers.length; i++) {
            const correctOption = Object.values(correctAnswers[i]).find(Boolean);
            const selectedOption = answers[`answer_${i}`];

            if (correctOption === selectedOption) {
                score++;
            }
        }

        await pool.query(`
            INSERT INTO quiz_results (student_name, quiz_name, score)
            VALUES ($1, $2, $3);
        `, [studentName, quizName, score]);
        const successMessage = `
        <html>
        <head>
            <style>
                body {
                    background-color: #f2f2f2;
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                }
    
                .success-message {
                    background-color: #005effe0;
                    color: #ffffff;
                    padding: 20px;
                    border-radius: 5px;
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                    text-align: center;
                }
    
                .success-message h2 {
                    margin: 0;
                    font-size: 24px;
                }
    
                .success-message p {
                    margin: 10px 0;
                    font-size: 18px;
                }
    
                .go-to-home-button {
                    margin-top: 20px;
                    background-color: #ffffff;
                    color: #005effe0;
                    padding: 10px 20px;
                    border: 1px solid #005effe0;
                    border-radius: 5px;
                    text-decoration: none;
                    font-size: 16px;
                    cursor: pointer;
                    transition: background-color 0.3s, color 0.3s;
                }
    
                .go-to-home-button:hover {
                    background-color: #005effe0;
                    color: #ffffff;
                }
            </style>
        </head>
        <body>
            <div class="success-message">
                <h2>Quiz submitted successfully!</h2>
                <p>Your score: ${score}</p>
                <a href="/ava_student" class="go-to-home-button">Go To Home</a>
            </div>
        </body>
        </html>
    `;

        res.send(successMessage);


    } catch (err) {
        console.error('Error in /submitquiz route:', err.stack);
        res.status(500).send('Internal Server Error: ' + err.message);
    }
});


app.get('/showresults/:quizName', (req, res) => {
    const quizName = req.params.quizName;

    // Fetch quiz results from the database based on quiz name
    const query = `
        SELECT student_name, score
        FROM quiz_results
        WHERE quiz_name = $1
    `;

    pool.query(query, [quizName], (error, result) => {
        if (error) {
            console.error('Error fetching quiz results:', error);
            res.status(500).send('Internal Server Error');
            return;
        }

        // Render the results using an appropriate template engine (e.g., EJS)
        res.render(__dirname + '/showresults.ejs', { quizName, quizResults: result.rows });
    });
});


// Assuming you have set up your Express app and connected to the database

// Route to handle deleting a quiz result by ID
app.delete('/deleteResult/:resultId', async (req, res) => {
    const resultId = req.params.resultId;

    try {
        // Perform the deletion operation in the database
        const deletedResult = await QuizResult.destroy({
            where: {
                id: resultId
            }
        });

        if (deletedResult) {
            res.status(200).send('Quiz result deleted successfully');
        } else {
            res.status(404).send('Quiz result not found');
        }
    } catch (error) {
        console.error('Error deleting quiz result:', error);
        res.status(500).send('An error occurred while deleting the quiz result');
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});