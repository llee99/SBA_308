

function validateData(course, assignmentGroup, learnerSubmissions) {
    // Validate course_id match
    if (assignmentGroup.course_id !== course.id) {
        throw new Error("AssignmentGroup does not belong to the specified Course.");
    }

    // Validate all assignment group fields
    if (typeof assignmentGroup.group_weight !== 'number') {
        throw new Error("group_weight must be a number.");
    }

    assignmentGroup.assignments.forEach(assignment => {
        if (assignment.points_possible <= 0) {
            throw new Error(`points_possible for assignment ${assignment.id} must be greater than zero.`);
        }
    });
}

function calculatePercentage(score, pointsPossible, latePenalty) {
    const adjustedScore = Math.max(0, score - latePenalty);
    return (adjustedScore / pointsPossible) * 100;
}

function getLearnerData(course, assignmentGroup, learnerSubmissions) {
    validateData(course, assignmentGroup, learnerSubmissions);

    const assignmentsById = assignmentGroup.assignments.reduce((map, assignment) => {
        map[assignment.id] = assignment;
        return map;
    }, {});

    const submissionsByLearner = {};

    learnerSubmissions.forEach(submission => {
        const learnerId = submission.learner_id;
        const assignmentId = submission.assignment_id;

        if (!submissionsByLearner[learnerId]) {
            submissionsByLearner[learnerId] = {};
        }

        submissionsByLearner[learnerId][assignmentId] = submission.submission;
    });

    const results = [];

    for (const learnerId in submissionsByLearner) {
        const learnerSubs = submissionsByLearner[learnerId];
        const learnerResult = { id: parseInt(learnerId, 10) };
        let totalWeightedScore = 0;
        let totalWeight = 0;
        const assignmentScores = {};

        for (const assignmentId in learnerSubs) {
            const assignment = assignmentsById[assignmentId];
            if (!assignment) {
                continue;
            }

            const dueDate = new Date(assignment.due_at);
            const now = new Date();
            if (dueDate > now) {
                continue;
            }

            const submissionDate = new Date(learnerSubs[assignmentId].submitted_at);

            let latePenalty = 0.0;
            if (submissionDate > dueDate) {
                latePenalty = 0.1 * assignment.points_possible;
            }

            const scorePercentage = calculatePercentage(
                learnerSubs[assignmentId].score,
                assignment.points_possible,
                latePenalty
            );

            assignmentScores[assignmentId] = scorePercentage;

            // Update weighted total and weight
            totalWeightedScore += (scorePercentage / 100) * assignment.points_possible * assignmentGroup.group_weight;
            totalWeight += assignment.points_possible * assignmentGroup.group_weight;
        }

        // Calculate and store the average if any weight has been counted
        if (totalWeight > 0) {
            learnerResult.avg = (totalWeightedScore / totalWeight) * 100;
        } else {
            learnerResult.avg = 0;
        }
         // Add assignment scores in sorted order
        Object.keys(assignmentScores).sort((a, b) => a - b).forEach(assignmentId => {
            learnerResult[assignmentId] = assignmentScores[assignmentId];
        });
        results.push(learnerResult);
    }

    return results;
}

// Example Usage
const courseInfo = {
id: 451,
name: "Introduction to JavaScript"
};

const assignmentGroup = {
id: 12345,
name: "Fundamentals of JavaScript",
course_id: 451,
group_weight: 25,
assignments: [
    {
    id: 1,
    name: "Declare a Variable",
    due_at: "2023-01-25",
    points_possible: 50
    },
    {
    id: 2,
    name: "Write a Function",
    due_at: "2023-02-27",
    points_possible: 150
    },
    {
    id: 3,
    name: "Code the World",
    due_at: "3156-11-15",
    points_possible: 500
    }
]
};

const learnerSubmissions = [
    {
        learner_id: 125,
        assignment_id: 1,
        submission: {
        submitted_at: "2023-01-25",
        score: 47
        }
    },
    {
        learner_id: 125,
        assignment_id: 2,
        submission: {
        submitted_at: "2023-02-12",
        score: 150
        }
    },
    {
        learner_id: 125,
        assignment_id: 3,
        submission: {
        submitted_at: "2023-01-25",
        score: 400
        }
    },
    {
        learner_id: 132,
        assignment_id: 1,
        submission: {
        submitted_at: "2023-01-24",
        score: 39
        }
    },
    {
        learner_id: 132,
        assignment_id: 2,
        submission: {
        submitted_at: "2023-03-07",
        score: 140
        }
    }
];

const results = getLearnerData(courseInfo, assignmentGroup, learnerSubmissions);
console.log(results);
