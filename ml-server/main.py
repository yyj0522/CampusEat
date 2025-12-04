import os
import urllib.parse
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import create_engine, text
import pandas as pd
import json

load_dotenv()

os.environ["PGCLIENTENCODING"] = "utf-8"

app = FastAPI()

API_KEY = os.getenv("ML_API_KEY", "campuseat-secret-key-1234")
security = HTTPBearer()

DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_USER = os.getenv("DB_USERNAME") 
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_DATABASE") 

if DB_PASSWORD:
    DB_PASSWORD = DB_PASSWORD.replace('"', '').replace("'", '').strip()

encoded_password = urllib.parse.quote_plus(DB_PASSWORD)

DB_URL = f"postgresql://{DB_USER}:{encoded_password}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(
    DB_URL,
    connect_args={'options': '-c client_encoding=utf8'}
)

def verify_api_key(credentials: HTTPAuthorizationCredentials = Security(security)):
    if credentials.credentials != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API Key")
    return credentials.credentials

@app.get("/")
def health_check():
    return {"status": "ok", "message": "ML Server is running"}

@app.post("/train-all", dependencies=[Depends(verify_api_key)])
def train_all_universities():
    try:
        with engine.connect() as conn:
            conn.execute(text("SET client_encoding = 'UTF8'"))
            universities = conn.execute(text('SELECT DISTINCT "universityId" FROM campus_status_message')).fetchall()
            university_ids = [row[0] for row in universities]

        results = []

        for uni_id in university_ids:
            query = f"""
                SELECT content, category, "createdAt"
                FROM campus_status_message
                WHERE "universityId" = {uni_id}
                AND "createdAt" >= NOW() - INTERVAL '4 weeks'
            """
            
            df = pd.read_sql(query, engine)

            if df.empty:
                continue

            df['createdAt'] = pd.to_datetime(df['createdAt'], utc=True)
            df['createdAt_kst'] = df['createdAt'].dt.tz_convert('Asia/Seoul')
            df['day'] = df['createdAt_kst'].dt.day_name().str.upper().str[:3]
            df['hour'] = df['createdAt_kst'].dt.hour
            df['minute_chunk'] = (df['createdAt_kst'].dt.minute // 15) * 15

            days = ['MON', 'TUE', 'WED', 'THU', 'FRI']
            
            for day in days:
                day_df = df[df['day'] == day]
                if day_df.empty:
                    continue

                timeline = []
                for hour in range(8, 23): 
                    for minute in [0, 15, 30, 45]:
                        slot_df = day_df[
                            (day_df['hour'] == hour) & 
                            (day_df['minute_chunk'] == minute)
                        ]

                        if len(slot_df) > 0:
                            top_category = slot_df['category'].mode()[0]
                            report_count = len(slot_df)
                            avg_count = report_count / 4 
                            congestion = min(100, int(avg_count * 20 + 10))
                            
                            summary = ""
                            if top_category == 'TRAFFIC':
                                if hour < 10: summary = "등교 셔틀/버스 대기열 발생 예상"
                                elif hour > 17: summary = "하교 셔틀/교통 혼잡 예상"
                                else: summary = "교내 이동 차량/셔틀 혼잡"
                            elif top_category == 'CAFETERIA': summary = "학식 및 교내 식당 대기열 혼잡"
                            elif top_category == 'WEATHER': summary = "노면 미끄러움 및 기상 주의"
                            elif top_category == 'EVENT': summary = "교내 행사/부스로 인한 인파 예상"
                            else: summary = "도서관/시설 이용 제보 집중"
                            
                            timeline.append({
                                "time": f"{hour:02d}:{minute:02d}",
                                "congestion": congestion,
                                "category": top_category,
                                "summary": summary
                            })

                if timeline:
                    timeline_json = json.dumps(timeline, ensure_ascii=False)
                    
                    upsert_query = text("""
                        INSERT INTO campus_prediction ("universityId", "dayOfWeek", "timeline", "updatedAt")
                        VALUES (:uni_id, :day, :timeline, NOW())
                        ON CONFLICT ("universityId", "dayOfWeek") 
                        DO UPDATE SET "timeline" = :timeline, "updatedAt" = NOW()
                    """)
                    
                    with engine.begin() as conn:
                        conn.execute(upsert_query, {"uni_id": uni_id, "day": day, "timeline": timeline_json})
            
            results.append(f"University {uni_id} updated.")

        return {"status": "success", "processed": results}

    except Exception as e:
        print(f"Error Detail: {e}")
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)