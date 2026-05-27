import app from '../hono/hono';
import findService from '../service/find-service';

app.get('/find/openai', async (c) => {
	try {
		const email = c.req.query('email');
		const token = c.req.query('t');
		const code = await findService.findOpenAiCode(c, { email, token });
		return c.text(code || '暂无验证码', 200, { 'Content-Type': 'text/plain; charset=utf-8' });
	} catch (e) {
		const status = e?.code && e.code >= 400 && e.code < 600 ? e.code : 500;
		return c.text(e?.message || 'error', status, { 'Content-Type': 'text/plain; charset=utf-8' });
	}
});
