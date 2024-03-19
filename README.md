# Quiz Application

Welcome to Quiz Application! This is a web-based platform designed to streamline the process of conducting quizzes for both teachers and students. Whether you're an educator looking to manage quizzes or a student eager to test your knowledge, this application has got you covered.

## Features

- **Teacher Dashboard**: Teachers have access to a dedicated dashboard where they can effortlessly create quizzes, review student scores, and manage questions. Additionally, they can import questions from Excel files, edit them, and set time constraints for each quiz session.

- **Student Portal**: Students can log in to their accounts and view their scores. They can also participate in quizzes within a time limit of 20 minutes.

- **Admin Controls**: Administrators have the authority to add both teachers and students to the system, ensuring smooth user management.

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript, EJS (Embedded JavaScript)
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL

## Setup Instructions

1. **Clone the repository**:

```bash
git clone https://github.com/your-username/Quiz-application.git
```

2. **Navigate to the project directory**:

```bash
cd Quiz-application
```

3. **Install dependencies**:

```bash
npm install
```

4. **Set up the database**:
   - Make sure PostgreSQL is installed and running.
   - Create a PostgreSQL database named `quizdb`.
   - Execute the provided SQL script (`schema.sql`) to set up the database schema.

5. **Configure environment variables**:
   - Create a `.env` file in the root directory.
   - Add the following variables:
     ```
     PORT=3000  # Or any other preferred port
     DB_USER=your_database_username
     DB_PASSWORD=your_database_password
     ```

6. **Start the server**:

```bash
npm start
```

7. **Access the application**:
   - Open a web browser and visit `http://localhost:3000` (or your specified port).

## Contributors

- [Gururaj B G](https://github.com/gururajbg)

 Feel free to contribute and customize as needed!
