// API documentation: https://bootcampspot.com/instructor-api-docs

var login=login;

var base_url='https://bootcampspot.com/api/instructor/v1/';

!async function(){
	var token_request=new Request(
	base_url+'login', {
		method: 'POST', 
		body: JSON.stringify(login), 
		headers: {
			'Content-Type': 'application/json'
		}
	});
	var auth_token=await fetch(token_request)
	// var auth_token=fetch(token_request)
		.then(response=>response.json())
		.then(auth_info=>auth_info['authenticationInfo']['authToken'])
		.then(auth_token=>{
			return auth_token;
		})
		.catch(error=>console.error('Error: ', error));
	console.log(auth_token);

	var course_request=new Request(
		base_url+'me', {
			method: 'GET', 
			headers: {
				'Content-Type': 'application/json', 
				'authToken': auth_token
			}
		}
	);
	var courseID=await fetch(course_request)
	// var courseID=fetch(course_request)
		.then(response=>response.json())
		.then(courses=>courses['Enrollments'])
		// retrieve first course
		.then(course_info=>course_info[0])
		.then(course=>{
			return course['courseId'];
		})
		.catch(error=>console.error('Error: ', error));
	console.log(courseID);

	var attendance_request=new Request(
		base_url+'attendance', {
			method: 'POST', 
			body: JSON.stringify({
				'courseID': courseID
			}), 
			headers: {
				'Content-Type': 'application/json', 
				'authToken': auth_token
			}
		}
	);
	var attendance_data=await fetch(attendance_request)
	// var attendance_data=fetch(attendance_request)
		.then(response=>response.json())
		.then(data=>{
			return data
		})
		// .then(plot_attendance())
		.catch(error=>console.error('Error: ', error));
	// function plot_attendance(attendance_data){
	var attendance={};
	attendance_data.forEach(d=>{
		if (d['present']) {
			if (d['sessionName'] in attendance) {
				attendance[d['sessionName']]+=1;
			} else { 
				attendance[d['sessionName']]=1;
			};
		};
	});
	var attendance_chart_data={
		'y': Object.values(attendance), 
		'x': Object.keys(attendance), 
		'type': 'bar'
	};
	var attendance_layout={
		// 'title': 'Attendance', 
		'margin': {'t': 0, 'l': 0}, 
		'font': {'size': 10}
	};
	Plotly.newPlot('attendance_chart', [attendance_chart_data], attendance_layout);
	// };
	console.log(attendance);
	// console.log(attendance_chart_data);

	var grades_request=new Request(
		base_url+'grades', {
			method: 'POST', 
			body: JSON.stringify({
				'courseID': courseID
			}), 
			headers: {
				'Content-Type': 'application/json', 
				'authToken': auth_token
			}
		}
	);
	var grades_data=await fetch(grades_request)
	// var grades_data=fetch(grades_request)
		.then(response=>response.json())
		.then(data=>{
			return data
		})
		.catch(error=>console.error('Error: ', error));
	var grades={};
	// console.log(grades_data);
	grades_data.forEach(d=>{
		var assignmentTitle=d['assignmentTitle']
		if (assignmentTitle in grades) {
			if (d['submitted']) {
				grades[assignmentTitle]['submitted']+=1
			} else {
				grades[assignmentTitle]['did not submit']+=1
			};
		} else { 
			grades[assignmentTitle]={
				'submitted': 0, 
				'did not submit': 0
			}
		};
	});
	var grades_submitted_chart_data={
		'y': Object.values(grades).map(assignment=>assignment['submitted']), 
		'x': Object.keys(grades), 
		'name': 'submitted',
		'type': 'bar'
	};
	var grades_missed_chart_data={
		'y': Object.values(grades).map(assignment=>assignment['did not submit']), 
		'x': Object.keys(grades), 
		'name': 'did not submit', 
		'type': 'bar'
	};
	var grades_layout={
		// 'title': 'Assignment Submission', 
		'margin': {'t': 0, 'l': 0}, 
		'font': {'size': 7}, 
		'barmode': 'stack'
	};
	Plotly.newPlot('grades_chart', [grades_submitted_chart_data, grades_missed_chart_data], grades_layout);
	console.log(grades);
	console.log(Object.values(grades));

	var feedback_request=new Request(
		base_url+'weeklyFeedback', {
			method: 'POST', 
			body: JSON.stringify({
				'courseID': courseID
			}), 
			headers: {
				'Content-Type': 'application/json', 
				'authToken': auth_token
			}
		}
	);
	var feedback_data=await fetch(feedback_request)
	// var feedback_data=fetch(feedback_request)
		.then(response=>response.json())
		.then(data=>{
			return data['submissions']
		})
		.catch(error=>console.error('Error: ', error));
	var feedback={};
	feedback_data.sort((a, b)=>{
		return new Date(a['date']).getTime()-new Date(b['date']).getTime();
	});
	// feedback_data.forEach(d=>{
	// 	var username=d['username']
	// 	if (username in grades) {
	// 		if (d['submitted']) {
	// 			grades[assignmentTitle]['submitted']+=1
	// 		} else {
	// 			grades[assignmentTitle]['did not submit']+=1
	// 		}
	// 	} else { 
	// 		grades[assignmentTitle]={
	// 			'submitted': 0, 
	// 			'did not submit': 0
	// 		};
	// 	}
	// });
	console.log(feedback_data);
}();
function init() {
	d3.csv('static/weeklyFeedback.csv').then(data=>{
		var student_list=data.map(d=>{
			return d['Student Name'];
		});
		student_list=[...new Set(student_list)];
		var selector=d3.select('#selDataset');
		student_list.forEach(student=>{
			selector.append('option')
				.text(student)
				.property('value', student);
		});
		chart_feedback(student_list[0]);
	});
};

function chart_feedback(student_name){
	d3.csv('static/weeklyFeedback.csv').then(data=>{
		var	data=data.filter(d=>{
			return d['Student Name']==student_name;
		});
		var data=data.sort(d=>{
			return d['Week'];
		});
		var student_feedback = data.reduce((acc, cur) => Object.assign(acc, ...Object.keys(cur).map(key => ({ [key]: (acc[key] || []).concat(cur[key]) }))), {})
		// var data=data.sort(d=>{
		// 	return d['Week'];
		// });
		// feedback_summary=[];
		// student_list.forEach(student=>{
		// 	var	one_student=data.filter(d=>{
		// 		return d['Student Name']==student;
		// 	});
		// 	var student_feedback = one_student.reduce((acc, cur) => Object.assign(acc, ...Object.keys(cur).map(key => ({ [key]: (acc[key] || []).concat(cur[key]) }))), {})
		// 	feedback_summary.push({
		// 		'Student Name': student, 
		// 		'Feedback': student_feedback
		// 	});
		// });
		var metrics_layout={
			// 'title': 'Student Feedback', 
			'margin': {t: 0}, 
			'hovermode': 'closest', 
			'xaxis': {
				'title': 'Week'
			}
		}; 
		var metrics=['Academic Support', 'Apply Learning Outside Class', 'Class Pace', 'Homework Feedback Rating', 'Instructor Clarity', 'Instructor Engagement', 'Instructor Knowledge', 'Overall Satisfaction']
		// console.log(feedback_summary);
		// console.log(student_name);
		// var student_feedback=feedback_summary.filter(d=>{
		// 	return d['Student Name']==student_name;
		// });
		// console.log(student_feedback[0]);
		var metrics_chart_data=metrics.map(metric=>{
			var chart_data={
				// 'x': student_feedback[0]['Feedback']['Submission Date'], 
				// 'y': student_feedback[0]['Feedback'][metric], 
				'x': student_feedback['Submission Date'], 
				'y': student_feedback[metric], 
				'mode': 'line', 
				'name': metric
			};
			return chart_data;
		}); 
		// console.log(data);
		Plotly.newPlot('feedback_chart', metrics_chart_data, metrics_layout);
	});
};

function optionChanged(new_name){
	chart_feedback(new_name);
};
// chart_feedback('Solongo Tserenkhand');
// console.log(feedback_summary);
init();