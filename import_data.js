const fs = require('fs');

// 简单的CSV解析函数
function parseCSV(content) {
    const lines = content.trim().split('\n');
    const headers = parseCSVLine(lines[0]);
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index] || '';
        });
        data.push(row);
    }
    
    return data;
}

// 解析CSV行（处理引号）
function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    values.push(current.trim());
    return values;
}

// 读取CSV文件
function readCSV(filename) {
    const content = fs.readFileSync(filename, 'utf8');
    return parseCSV(content);
}

// 生成唯一ID
function generateId(prefix) {
    return prefix + Date.now() + Math.random().toString(36).substr(2, 9);
}

// 导入数据到localStorage格式
function importData() {
    console.log('开始导入数据...\n');
    
    // 读取CSV文件
    const classesData = readCSV('classes.csv');
    const studentsData = readCSV('students.csv');
    const scoresData = readCSV('scores.csv');
    
    console.log(`✓ 读取到 ${classesData.length} 个班级`);
    console.log(`✓ 读取到 ${studentsData.length} 名学生`);
    console.log(`✓ 读取到 ${scoresData.length} 条成绩记录`);
    
    // 构建数据结构
    const data = {
        classes: []
    };
    
    // 处理班级数据
    classesData.forEach(cls => {
        data.classes.push({
            id: cls['班级ID'],
            name: cls['班级名称'],
            grade: cls['年级'],
            combination: cls['选科组合'],
            students: [],
            exams: [],
            scores: []
        });
    });
    
    // 处理学生数据
    studentsData.forEach(student => {
        const classId = student['班级ID'];
        const cls = data.classes.find(c => c.id === classId);
        if (cls) {
            cls.students.push({
                id: student['学号'],
                name: student['姓名']
            });
        }
    });
    
    console.log(`✓ 已处理学生数据`);
    
    // 处理成绩数据
    let scoreCount = 0;
    
    scoresData.forEach(score => {
        const className = score['班级'];
        const cls = data.classes.find(c => c.name === className);
        if (!cls) return;
        
        const studentId = score['学号'];
        const student = cls.students.find(s => s.id === studentId);
        if (!student) return;
        
        const examType = score['考试类型'];
        
        // 查找或创建考试
        let exam = cls.exams.find(e => e.name === examType);
        if (!exam) {
            // 根据考试类型分配不同的日期
            const examDates = {
                '月考1': '2024-10-15',
                '月考2': '2024-11-15',
                '月考3': '2024-12-15',
                '期中考试': '2024-11-01',
                '期末考试': '2025-01-15'
            };
            
            exam = {
                id: generateId('e'),
                name: examType,
                date: examDates[examType] || new Date().toISOString().split('T')[0]
            };
            cls.exams.push(exam);
        }
        
        // 添加成绩记录
        const scoreValue = parseInt(score['得分']) || 0;
        const totalScore = parseInt(score['满分']) || 100;
        const rank = parseInt(score['排名']) || 1;
        
        cls.scores.push({
            id: generateId('sc'),
            studentId: studentId,
            examId: exam.id,
            subject: score['科目'],
            score: Math.min(scoreValue, totalScore),
            totalScore: totalScore,
            rank: rank,
            classSize: cls.students.length,
            difficulty: '一般'
        });
        scoreCount++;
    });
    
    console.log(`✓ 已处理 ${scoreCount} 条成绩记录`);
    
    // 生成localStorage导入脚本
    const importScript = `
// 考试成绩追踪分析工具 - 数据导入脚本
// 生成时间: ${new Date().toLocaleString()}

(function() {
    const data = ${JSON.stringify(data, null, 2)};
    
    // 保存到localStorage
    localStorage.setItem('examTracker_teacherData', JSON.stringify(data));
    
    console.log('数据导入成功！');
    console.log('- 班级数量: ' + data.classes.length);
    console.log('- 学生总数: ' + data.classes.reduce((sum, c) => sum + c.students.length, 0));
    console.log('- 成绩总数: ' + data.classes.reduce((sum, c) => sum + c.scores.length, 0));
    
    alert('数据导入成功！\\n班级数量: ' + data.classes.length + 
          '\\n学生总数: ' + data.classes.reduce((sum, c) => sum + c.students.length, 0) +
          '\\n成绩总数: ' + data.classes.reduce((sum, c) => sum + c.scores.length, 0));
    
    // 刷新页面
    location.reload();
})();
`;
    
    fs.writeFileSync('import_to_localstorage.js', importScript, 'utf8');
    console.log('\n✓ 已生成 import_to_localstorage.js');
    
    // 同时生成JSON格式的数据文件
    fs.writeFileSync('teacher_data.json', JSON.stringify(data, null, 2), 'utf8');
    console.log('✓ 已生成 teacher_data.json');
    
    // 生成统计信息
    console.log('\n========== 导入统计 ==========');
    console.log(`班级数量: ${data.classes.length}`);
    console.log(`学生总数: ${data.classes.reduce((sum, c) => sum + c.students.length, 0)}`);
    console.log(`考试总数: ${data.classes.reduce((sum, c) => sum + c.exams.length, 0)}`);
    console.log(`成绩总数: ${data.classes.reduce((sum, c) => sum + c.scores.length, 0)}`);
    console.log('\n各班级统计:');
    data.classes.forEach(cls => {
        console.log(`  ${cls.name}: ${cls.students.length}人, ${cls.exams.length}场考试, ${cls.scores.length}条成绩`);
    });
    
    console.log('\n========== 使用说明 ==========');
    console.log('方法1: 在浏览器控制台执行（推荐）');
    console.log('  1. 打开 index.html 文件');
    console.log('  2. 按 F12 打开开发者工具');
    console.log('  3. 将 import_to_localstorage.js 的内容复制到控制台执行');
    console.log('');
    console.log('方法2: 通过应用导入功能');
    console.log('  1. 打开 index.html 文件');
    console.log('  2. 进入"我是老师" -> "数据导入导出"');
    console.log('  3. 使用生成的CSV文件导入');
    
    return data;
}

// 执行导入
importData();
