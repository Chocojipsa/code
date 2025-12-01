const express = require('express');
const axios = require('axios');
const cors = require('cors');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS 허용
app.use(cors());
app.use(express.json());

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

    // --- Cheerio를 이용한 문제 정보 파싱 ---
    
    // 1. 문제 제목
    const title = $('#problem_title').text().trim();

    // 2. 문제 내용 (HTML 형식으로 가져와야 수식, 서식 유지)
    const descriptionHTML = $('#problem_description').html() || '';

    // 3. 입력 (HTML 형식으로 가져와야 서식 유지)
    const inputSpecHTML = $('#problem_input').html() || '';

    // 4. 출력 (HTML 형식으로 가져와야 서식 유지)
    const outputSpecHTML = $('#problem_output').html() || '';

    // 5. 제한 (HTML 형식으로 가져와야 서식 유지)
    const limitHTML = $('#problem_limit').html() || '';

    // 6. 알고리즘 분류 (태그 섹션)
    const tags = [];
    // #problem_tags 섹션 내의 .spoiler-list 아래에 있는 모든 <a> 태그를 찾습니다.
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
        // (참고: 입력/출력 예시는 별도의 ID로 추출 가능합니다.)
        // inputExample: $('#sample-input-1').text().trim(), 
        // outputExample: $('#sample-output-1').text().trim(),
    });
} catch (err) {
    console.error('백준 데이터 패치 및 파싱 실패:', err.message);
    // 에러 발생 시 404, 403 등 상태 코드를 포함하여 응답
    const statusCode = err.response ? err.response.status : 500;
    res.status(statusCode).json({ error: 'Failed to fetch or parse problem data', detail: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));