const express = require('express');
const axios = require('axios');
const cors = require('cors');

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
        // 브라우저인 척
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Referer': 'https://www.acmicpc.net/'
      },
      // 로그인 필요하면 쿠키 추가
      // cookie: 'OnlineJudge=로그인쿠키값'
    });

    const html = response.data;

    // TODO: cheerio로 필요한 정보 파싱
    // 예: 문제 제목, 입력/출력 예시, 문제 분류
    const cheerio = require('cheerio');
    const $ = cheerio.load(html);
    const title = $('#problem_title').text().trim();
    const category = $('.problem-info').first().text().trim(); // 예시
    const inputExample = $('#sample-input-1').text().trim();
    const outputExample = $('#sample-output-1').text().trim();

    console.log("테스트테스트")

    res.json({
      problemId,
      title,
      category,
      inputExample,
      outputExample
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch problem' });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
