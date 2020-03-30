//let mongoose = require('mongoose');
const Goal = require('../models/goal');
const { CanvasRenderService } = require('chartjs-node-canvas');


async function getAllGoals(req, res) {
    let goals = await Goal.find({ user_id: req.user.id });
    res.json(goals);
}

async function getGoal(req, res) {
    let goal = await Goal.findOne({ user_id: req.user.id, _id: req.params.goal });
    res.json(goal);
}

async function createGoal(req, res) {
    let goal = new Goal({ ...req.body });
    goal.user_id = req.user.id;
    try {
        let goal2 = await goal.save();
        console.log("After", goal2);
    } catch (error) {
        console.log(error)
    }
    res.json(goal);
}

async function deleteGoal(req, res) {
    try {
        await Goal.findOneAndDelete({ user_id: req.user.id, _id: req.body._id });
        res.send({ delete: true });
    } catch (error) {
        res.send(error);
    }
}

async function updateGoal(req, res) {
    try {
        let goal = new Goal({ ...req.body });
        goal.user_id = req.user.id;
        await Goal.findOneAndUpdate({ user_id: req.user.id, _id: goal._id }, { $set: goal });
        res.send(goal);
    } catch (error) {
        res.send(error);
    }
}

async function getGraph(req, res) {
    console.log("GENERATING")
    console.log(req.body);
    data = buildData(req.body);

    const width = 800;
    const height = 600;
    const canvasRenderService = new CanvasRenderService(width, height, (ChartJS) => { });

    const configuration = {
        data: buildDatasets(data),
        options: {
            scales: {
                xAxes: [{
                    stacked: true
                }],
                yAxes: [
                    {
                        id: 'A',
                        type: 'linear',
                        stacked: true,
                        position: 'left',
                    }, {
                        id: 'B',
                        type: 'linear',
                        position: 'right',
                    }
                ]
            }
        }
    };
    const dataUrl = await canvasRenderService.renderToDataURL(configuration);
    res.send({ image: dataUrl});
}


module.exports = {

    getAllGoals, // Get
    getGoal, // Get
    createGoal, // Post
    updateGoal, // Put
    deleteGoal, // Delete

    getGraph

};

buildData = (fields) => {
    // Dataset to Graph Info
    let ds = {
        labels: [],
        data: [],
        x_labels: []
    };

    let result = (fields.insertAssets ? fields.assetsTotal : 0);
    if (fields.irrOnResult !== 0) {
        //Backing assets to Update on First Month
        result /= Math.pow(1 + (fields.irrOnResult / 100), 1 / 12);
    }
    let minDate = new Date();
    let maxDate = new Date();

    for (let i = 0; i < fields.boxes.length; ++i) {
        fields.boxes[i].dateStart = new Date(fields.boxes[i].dateStart);
        fields.boxes[i].dateEnd = new Date(fields.boxes[i].dateEnd);
        if (minDate > fields.boxes[i].dateStart) { minDate = fields.boxes[i].dateStart }
        if (maxDate < fields.boxes[i].dateEnd) { maxDate = fields.boxes[i].dateEnd }
        ds.labels.push(fields.boxes[i].description);
        ds.data.push([]);
    }
    ds.labels.push("Result");
    ds.data.push([]);


    //Cloning the date
    let currentMonth = new Date(minDate.getTime());
    // Picking any day since the month is most important
    currentMonth.setDate(10);
    maxDate.setDate(10);

    while (evaluateDate(maxDate, currentMonth) >= 0) {
        if (fields.irrOnResult !== 0) {
            result *= Math.pow(1 + (fields.irrOnResult / 100), 1 / 12);
        }
        pushMonth(currentMonth, ds, fields, result);
        //Updating current month
        if (currentMonth.getMonth() === 11) {
            currentMonth.setMonth(0);
            currentMonth.setFullYear(currentMonth.getFullYear() + 1);
        } else {
            currentMonth.setMonth(currentMonth.getMonth() + 1);
        }
    }
    return ds;
}

pushMonth = (month, ds, fields, result) => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const header = monthNames[month.getMonth()] + " " + month.getFullYear();
    //const tds = [<th key={header}>{header}</th>];
    ds.x_labels.push(header);
    fields.boxes.forEach((box, i) => {
        let value = box.value;
        //Current after Start and before end
        if (evaluateDate(month, box.dateStart) >= 0 && evaluateDate(month, box.dateEnd) <= 0) {
            let periodicity;
            switch (box.periodicity) {
                case "monthly":
                    periodicity = 1;
                    break;
                case "bimonthly":
                    periodicity = 2;
                    break;
                case "quaterly":
                    periodicity = 3;
                    break;
                case "fourmonth":
                    periodicity = 4;
                    break;
                case "biyearly":
                    periodicity = 6;
                    break;
                case "yearly":
                    periodicity = 12;
                    break;
                default:
                    periodicity = 1;
                    break;
            }
            if (box.dateStart.getMonth() % periodicity === month.getMonth() % periodicity) {
                let rate;
                if (box.useIRR) {
                    rate = fields.myIrr;
                } else {
                    rate = box.interestRate
                }
                value = value * Math.pow(1 + (rate / 100), getExponential(box.dateStart, month));
                result += value;
                ds.data[i].push(Math.floor(value * 100) / 100); // 2 decimal places

            } else { // No value for this current month
                ds.data[i].push(0);
            }
        } else { //out of interval
            ds.data[i].push(0);
        }
    });

    ds.data[ds.data.length - 1].push(Math.floor(result * 100) / 100);
}

getExponential = (dateA, dateB) => {
    let e = dateB.getFullYear() - dateA.getFullYear();
    if (dateB.getMonth() < dateA.getMonth()) { // Not a complete year
        --e;
    }
    return (e);
}

/**
 *  1 A Bigger, 
 *  0 Equal, 
 * -1 B Bigger, 
 */
evaluateDate = (dateA, dateB) => {
    if (dateA.getFullYear() > dateB.getFullYear()) { //Year A greater
        return 1;
    } else if (dateA.getFullYear() < dateB.getFullYear()) { //Year B greater
        return -1;
    } else if (dateA.getMonth() > dateB.getMonth()) { //Same Year, Month A greater
        return 1;
    } else if (dateA.getMonth() < dateB.getMonth()) { //Same Year, Month B greater
        return -1;
    } else {
        return 0;
    }
}

buildDatasets = (ds) => {
    const colors = ["#eabd5d", "#cb5b5a", "#ac557a", "#8d4c7d", "#40324f"];
    // last element on DS data is the result (handled later)
    const MAX_BARS = 12;
    const datasets = [];
    let labels = [];
    for (let i = 0; i < ds.data.length; i++) {
        const dataset = {};
        if (ds.data[i].length <= MAX_BARS) {
            dataset.data = ds.data[i];
            labels = ds.x_labels;
        } else {
            const pass = Math.floor(ds.data[i].length / MAX_BARS);
            const dataArray = [];
            let total = 0;
            for (let j = 0; j < ds.data[i].length; ++j) {
                if (j % pass === pass - 1 || (ds.data[i].length - 1) === j) {
                    total += ds.data[i][j];
                    dataArray.push(total);
                    total = 0;
                    if (i === 0) { // Single array
                        labels.push(ds.x_labels[j]);
                    }
                } else {
                    total += ds.data[i][j];
                }
            }
            dataset.data = dataArray;
        }
        dataset.label = ds.labels[i];
        dataset.backgroundColor = colors[i % colors.length];
        dataset.order = i;
        dataset.yAxisID = 'A';
        dataset.type = 'bar';
        datasets.push(dataset);
    }
    datasets[datasets.length - 1].yAxisID = 'B';
    datasets[datasets.length - 1].type = 'line';
    datasets[datasets.length - 1].backgroundColor = 'rgba(172,85,98,0.3)';
    return { datasets: datasets, labels: labels };
}
