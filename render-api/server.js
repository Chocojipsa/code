const express = require('express');
const axios = require('axios');
const cors = require('cors');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS 허용
app.use(cors());
app.use(express.json());

function cleanupHTML(htmlString) {
    if (!htmlString) return '';
    // 1. 문자열의 양 끝에 있는 공백/줄바꿈 제거
    let cleaned = htmlString.trim();
    
    // 2. HTML 요소 사이에 불필요한 연속된 공백(줄바꿈 포함)을 하나의 공백으로 치환
    // 백준 페이지의 경우 <p> 태그 사이에 있는 \n\t 등을 제거합니다.
    // 주의: MathJax 수식이나 코드 블록 안의 공백은 유지해야 하므로, 
    // 여기서는 문자열의 시작/끝과 HTML 태그 주변의 공백/줄바꿈만 집중적으로 제거합니다.
    
    // 예시: <p>     \n\t내용</p> -> <p>내용</p>
    // 태그 사이에 있는 불필요한 줄바꿈/공백 제거
    cleaned = cleaned.replace(/>\s*</g, '><');
    
    // HTML 양 끝의 \n \t 제거 (trim()으로 처리되지만 다시 한번)
    cleaned = cleaned.replace(/^[\s\n\t]+|[\s\n\t]+$/g, '');
    
    return cleaned;
}


app.get('/getProblem', async (req, res) => {
  const problemId = req.query.problemId;
  if (!problemId) return res.status(400).json({ error: 'problemId is required' });

  try {
    const response = await axios.get(`https://www.acmicpc.net/problem/${problemId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Referer': 'https://www.acmicpc.net/'
      },
    });

    const html = response.data;
    const $ = cheerio.load(html);

    const descriptionHTML = cleanupHTML($('#problem_description').html());
    const inputSpecHTML = cleanupHTML($('#problem_input').html());
    const outputSpecHTML = cleanupHTML($('#problem_output').html());
    const limitHTML = cleanupHTML($('#problem_limit').html());

    const tags = [];
    $('#problem_tags .spoiler-list a.spoiler-link').each((i, element) => {
        tags.push($(element).text().trim());
    });
    
    // --- 결과 반환 ---

    res.json({
        problemId,
        title,
        description: descriptionHTML,
        inputSpec: inputSpecHTML,
        outputSpec: outputSpecHTML,
        limit: limitHTML,
        tags: tags,
    });
} catch (err) {
    console.error('백준 데이터 패치 및 파싱 실패:', err.message);
    // 에러 발생 시 404, 403 등 상태 코드를 포함하여 응답
    const statusCode = err.response ? err.response.status : 500;
    res.status(statusCode).json({ error: 'Failed to fetch or parse problem data', detail: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));