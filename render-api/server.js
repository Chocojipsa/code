const express = require('express');
const axios = require('axios');
const cors = require('cors');
const cheerio = require('cheerio'); 

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- HTML 태그 제거 및 순수 텍스트 추출 함수 ---
function extractPlainText(htmlElement, $) {
    if (!htmlElement || !htmlElement.length) return '';

    // 1. 원본을 변경하지 않기 위해 요소를 복제합니다.
    const $cloned = htmlElement.clone();

    // 2. [필수] 이미지 태그(<img>)를 완전히 제거합니다. (백준 상대 경로 문제 해결)
    $cloned.find('img').remove();

    // 3. 텍스트 추출 시 문단이 붙는 것을 방지하기 위해, 
    // <p>와 같은 블록 요소 뒤에 명시적으로 두 줄바꿈을 삽입합니다.
    $cloned.find('p, br, div, ul, ol, li').each((i, el) => {
        // Cheerio를 사용하여 요소 뒤에 텍스트로 줄바꿈을 추가합니다.
        $(el).after('\n\n');
    });

    // 4. 순수 텍스트를 추출합니다.
    let cleanText = $cloned.text();

    // 5. 불필요한 공백과 줄바꿈 문자열을 정리합니다.
    // - 여러 개의 연속된 줄바꿈을 두 개 이하로 줄입니다.
    cleanText = cleanText.replace(/(\n\s*){2,}/g, '\n\n');
    // - 문자열의 앞뒤 공백과 줄바꿈을 제거합니다.
    cleanText = cleanText.trim();
    
    // 최종적으로 \t 등 기타 공백 문자를 일반 공백으로 치환
    cleanText = cleanText.replace(/[\t\r]/g, '');

    return cleanText;
}
// ----------------------------------------------------

app.get('/getProblem', async (req, res) => {
    const problemId = req.query.problemId;
    // ... (문제 ID 검증 생략)

    try {
        // ... (axios 요청 및 HTML 데이터 가져오는 부분 생략)
        const response = await axios.get(`https://www.acmicpc.net/problem/${problemId}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.acmicpc.net/' 
            },
        });
        const html = response.data;
        const $ = cheerio.load(html);
        
        // --- 파싱 및 순수 텍스트 추출 적용 ---
        
        // 1. 문제 제목 (텍스트만 추출되므로 trim()으로 충분)
        const title = $('#problem_title').text().trim();

        // 2. 순수 텍스트 추출 함수 적용
        const descriptionText = extractPlainText($('#problem_description'), $);
        const inputSpecText = extractPlainText($('#problem_input'), $);
        const outputSpecText = extractPlainText($('#problem_output'), $);
        const limitText = extractPlainText($('#problem_limit'), $);

        // 3. 알고리즘 분류 (텍스트만 추출)
        const tags = [];
        $('#problem_tags .spoiler-list a.spoiler-link').each((i, element) => {
            tags.push($(element).text().trim());
        });
        
        // --- 결과 반환 ---

        res.json({
            problemId,
            title,
            description: descriptionText,
            inputSpec: inputSpecText,
            outputSpec: outputSpecText,
            limit: limitText,
            tags: tags,
        });
    } catch (err) {
        // ... (에러 처리 생략)
        console.error('백준 데이터 패치 및 파싱 실패:', err.message);
        const statusCode = err.response ? err.response.status : 500;
        res.status(statusCode).json({ error: 'Failed to fetch or parse problem data', detail: err.message });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));