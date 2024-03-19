// const topic1 = document.getElementById("topic1");
// const topic2 = document.getElementById("topic2");
// const topic3 = document.getElementById("topic3");
// const topic4 = document.getElementById("topic4");
// const topic5 = document.getElementById("topic5");
// const topic6 = document.getElementById("topic6");
// const topic7 = document.getElementById("topic7");
// const topic8 = document.getElementById("topic8");
// const topic9 = document.getElementById("topic9");
// const topic10 = document.getElementById("topic10");
// const addquestion = document.getElementById("add-question-container");
// const heading = document.getElementById("heading");

// function addquestions(id) {
//     addquestion.style.display = "block";
//     heading.innerText = "Add Question for " + id;

//     function delayPostRequest(event) {
//         event.preventDefault();
//         setTimeout(function () {
//             var form = document.createElement('form');
//             form.action = "/" + "topic";
//             form.method = 'post';

//             // Copy input fields from the original form to the dynamically created form
//             const originalForm = document.getElementById("add-question-form");
//             Array.from(originalForm.elements).forEach(function (element) {
//                 if (element.tagName.toLowerCase() !== 'button') {
//                     var clonedElement = element.cloneNode(true);
//                     form.appendChild(clonedElement);
//                 }
//             });

//             document.body.appendChild(form);
//             form.submit();
//         }, 0);
//     }

//     // Attach the event listener only once
//     document.getElementById("add-question-form").addEventListener("submit", delayPostRequest);
// }
