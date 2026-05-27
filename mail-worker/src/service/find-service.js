import BizError from '../error/biz-error';
import orm from '../entity/orm';
import { and, desc, eq } from 'drizzle-orm';
import emailEntity from '../entity/email';
import userService from './user-service';
import emailUtils from '../utils/email-utils';
import { emailConst, isDel } from '../const/entity-const';
import { t } from '../i18n/i18n';

const CODE_REGEX = /(?<!\d)\d{6}(?!\d)/;

function pickCode(text) {
	if (!text) return '';
	const match = text.match(CODE_REGEX);
	return match ? match[0] : '';
}

const findService = {

	async findOpenAiCode(c, params) {

		const { email, token } = params;

		const findToken = c.env.find_token;

		if (!findToken) {
			throw new BizError(t('findTokenNotConfig'), 500);
		}

		if (!token || token !== findToken) {
			throw new BizError(t('publicTokenFail'), 401);
		}

		if (!email) {
			throw new BizError(t('emptyEmail'), 400);
		}

		if (email === c.env.admin) {
			throw new BizError(t('adminNotAllow'), 403);
		}

		const userRow = await userService.selectByEmail(c, email);

		if (!userRow) {
			throw new BizError(t('notExistUser'), 404);
		}

		const emailRow = await orm(c).select().from(emailEntity).where(
			and(
				eq(emailEntity.userId, userRow.userId),
				eq(emailEntity.type, emailConst.type.RECEIVE),
				eq(emailEntity.isDel, isDel.NORMAL)
			))
			.orderBy(desc(emailEntity.emailId))
			.limit(1)
			.get();

		if (!emailRow) {
			return '';
		}

		if (emailRow.code && /^\d{6}$/.test(emailRow.code)) {
			return emailRow.code;
		}

		const candidates = [
			emailRow.text,
			emailUtils.htmlToText(emailRow.content || ''),
			emailRow.subject
		];

		for (const candidate of candidates) {
			const code = pickCode(candidate);
			if (code) return code;
		}

		return '';
	}
};

export default findService;
