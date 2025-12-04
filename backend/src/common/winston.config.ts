import { utilities, WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import * as winstonDaily from 'winston-daily-rotate-file';

const env = process.env.NODE_ENV;
const logDir = __dirname + '/../../logs'; 

const dailyOptions = (level: string) => {
  return {
    level,
    datePattern: 'YYYY-MM-DD',
    dirname: logDir + `/${level}`,
    filename: `%DATE%.${level}.log`,
    maxFiles: '14d', 
    zippedArchive: true, 
  };
};

export const winstonLogger = WinstonModule.createLogger({
  transports: [
    new winston.transports.Console({
      level: env === 'production' ? 'info' : 'debug',
      format: env === 'production'
        ? winston.format.simple()
        : winston.format.combine(
            winston.format.timestamp(),
            utilities.format.nestLike('CampusEat', {
              prettyPrint: true,
              colors: true,
            }),
          ),
    }),
    
    new winstonDaily(dailyOptions('info')),
    new winstonDaily(dailyOptions('error')),
  ],
});