const express = require('express');
const cors = require('cors');
const pool = require('./database');

const multer= require('multer');
const fs=require('fs');
const path= require('path');
const app = express();
const PDFDocument = require('pdfkit');
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const dayjs= require('dayjs');


const port = 4000;

app.post('/adduser', async (req, res) => {
    const { username, password } = req.body;
  
    const insertData = 'INSERT INTO accounts (username, password) VALUES ($1, $2) RETURNING *';
  
    try {
      const result = await pool.query(insertData, [username, password]);
      res.status(200).json({ message: 'User added', user: result.rows[0] });
    } catch (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'Error during insertion' });
    }
  });

 

  app.get('/get-all-doctors', async (req, res) => {
    try {
      const query = `
        SELECT firstname, fathername, idnumber, profession
        FROM doctors;
      `;
  
      const result = await pool.query(query);
      res.status(200).json(result.rows);
    } catch (error) {
      console.error('Fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch doctors' });
    }
  });



  app.post('/checking', async (req, res) => {
    const { username, password } = req.body;
  
    const queryAccounts = 'SELECT * FROM accounts WHERE username = $1 AND password = $2';
    const queryDoctors = 'SELECT * FROM doctors WHERE idnumber = $1 AND profession = $2';
    const queryClerk = 'SELECT * FROM clerk WHERE username = $1 AND password = $2';
    const queryTriage = 'SELECT * FROM triage WHERE username = $1 AND password = $2';
    const queryLaboratorist = 'SELECT * FROM laboratorist WHERE username = $1 AND password = $2';
    const queryPharmacist = 'SELECT * FROM pharma WHERE username = $1 AND password = $2';
  
    try {
      const resultAccount = await pool.query(queryAccounts, [username, password]);
      if (resultAccount.rows.length > 0) {
        return res.json({ found: true, type: 'account', message: 'Successfully logged in as user.' });
      }
  
      const resultDoctor = await pool.query(queryDoctors, [username, password]);
      if (resultDoctor.rows.length > 0) {
  const doctor = resultDoctor.rows[0];
  return res.json({
    found: true,
    type: 'doctor',
    profession: doctor.profession, 
    message: 'Successfully logged in as doctor.',
  });
}
  
      const resultClerk = await pool.query(queryClerk, [username, password]);
      if (resultClerk.rows.length > 0) {
        return res.json({ found: true, type: 'clerk', message: 'Successfully logged in as a Clerk.' });
      }
  
      const resultTriage = await pool.query(queryTriage, [username, password]);
      if (resultTriage.rows.length > 0) {
        return res.json({ found: true, type: 'triage', message: 'Successfully logged in as a Triage Clerk.' });
      }
      const resultPharma = await pool.query(queryPharmacist, [username, password]);
      if (resultPharma.rows.length > 0) {
        return res.json({ found: true, type: 'pharma', message: 'Successfully logged in as doctor.' });
      }
      const resultLaboratorist = await pool.query(queryLaboratorist, [username, password]);
      if (resultLaboratorist.rows.length > 0) {
        return res.json({ found: true, type: 'laboratorist', message: 'Successfully logged in as a laboratorist.' });
      }
  
     
      return res.json({ found: false, message: 'Invalid credentials.' });
  
    } catch (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database query failed' });
    }
  });
  

  app.post('/adddoctors', async (req, res) => {
    const { fname, faname, idno, profession} = req.body;
  
    const insertDatas = 'INSERT INTO doctors (firstname, fathername, idnumber, profession) VALUES ($1, $2, $3, $4) RETURNING *';
  
    try {
      const result = await pool.query(insertDatas, [fname, faname, idno, profession]);
      res.status(200).json({ message: 'User added', user: result.rows[0] });
    } catch (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'Error during insertion' });
    }
  });

  app.post('/docaccount', async (req, res) => {
    const { fname, lname, sex, specialization, username, password} = req.body;
  
    const insertDocData = 'INSERT INTO doclist ( fname, lname, sex, specialization, username, password) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *';
  
    try {
      const result = await pool.query(insertDocData, [ fname, lname, sex, specialization, username, password]);
      res.status(200).json({ message: 'Doctor added', user: result.rows[0] });
    } catch (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'Error during insertion' });
    }
  });


  app.post('/addlaboratorist', async (req, res) => {
    const { fname, faname, sex, username, password} = req.body;
  
    const insertDatass = 'INSERT INTO laboratorist (firstname, fathername, sex, username, password) VALUES ($1, $2, $3, $4, $5) RETURNING *';
  
    try {
      const result = await pool.query(insertDatass, [fname, faname, sex, username, password]);
      res.status(200).json({ message: 'Laboratorist is added', user: result.rows[0] });
    } catch (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'Error during insertion' });
    }
  });

  const upload = multer({ dest: 'uploads/' });
  app.post('/add-patient', upload.single('picture'), async (req, res) => {
    try {
      const { fname, faname, dob, cardno } = req.body;
      const picturePath = req.file?.path;
  
      let pictureBuffer = null;
      if (picturePath) {
        pictureBuffer = fs.readFileSync(picturePath);
        fs.unlinkSync(picturePath); // Clean up file after reading
      }
  
      const patientdata = `
        INSERT INTO patient (name, fathername, date_of_birth, cardnumber, picture)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
      `;
      const result = await pool.query(patientdata, [fname, faname, dob, cardno, pictureBuffer]);
      res.status(201).json({ message: 'Patient registered', cardnumber: result.rows[0].cardnumber });
    } catch (error) {
      console.error('Insert error:', error);
      res.status(500).json({ error: 'Failed to insert patient' });
    }
  });
  

  app.get('/get-all-patients', async (req, res) => {
    try {
      const query = `
        SELECT name, fathername, date_of_birth, cardnumber, picture
        FROM patient;
      `;
  
      const result = await pool.query(query);
  
      const patients = result.rows.map((p) => ({
        ...p,
        image: p.picture ? Buffer.from(p.picture).toString('base64') : null,
      }));
  
      res.status(200).json(patients);
    } catch (error) {
      console.error('Fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch patients' });
    }
  });
  
  app.post('/register-patients', upload.none(), async (req, res) => {
    try {
      const {
        fname,
        middle,
        last,
        dob,
        sex,
        kebele
      } = req.body;
  
      const result = await pool.query(`SELECT nextval('cardno_seqs') AS next`);
      const rawCardNo = result.rows[0].next;
      const cardno = '1111' + rawCardNo.toString().padStart(11, '0');
      const registers = `
        INSERT INTO patients (
          cardno, fname, mname, lname, date_of_birth, sex, kebele
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;
      await pool.query(registers, [cardno, fname, middle, last, dob, sex, kebele]);
  
      res.status(201).json({ success: true, cardno });
  
    } catch (error) {
      console.error('Error registering patient:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  app.get('/next-cardno', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT last_value, increment_by
        FROM pg_sequences
        WHERE schemaname = 'public' AND sequencename = 'cardno_seqs'
      `);
  
      const { last_value, increment_by } = result.rows[0];
      const next = parseInt(last_value) + parseInt(increment_by);
      const cardno = '1111' + next.toString().padStart(11, '0');
  
      res.json({ cardno });
    } catch (error) {
      console.error('Error fetching next card number:', error);
      res.status(500).json({ error: 'Could not fetch next card number' });
    }
  });

  app.get('/registered-patients', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM patients ORDER BY registered_at DESC');
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching patients:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  app.get('/from-history', async (req, res) => {
    try {
     // const results = await pool.query('SELECT cardno, fname, mname, sex, diagnosis, lab_checkups FROM patienthistory ORDER BY cardno DESC ');
     const results= await pool.query('SELECT ph.cardno, ph.fname, ph.mname, ph.sex, ph.diagnosis, ph.lab_checkups, lr.doctor_note FROM patienthistory ph JOIN pharmacyrequests lr ON ph.cardno=lr.cardno ORDER BY cardno DESC');
     res.json(results.rows);
    } catch (error) {
      console.error('Error fetching patients:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/pharma-requests', async (req, res) => {
    try {
      const results = await pool.query('SELECT cardno, fullname, doctor_note, created_at FROM pharmacyrequests ORDER BY created_at DESC');
      res.json(results.rows);
    } catch (error) {
      console.error('Error fetching patients:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/register-clerk', async (req, res) => {
    const { username, password} = req.body;
  
    const insertClerk = 'INSERT INTO clerk (username, password) VALUES ($1, $2) RETURNING *';
  
    try {
      const result = await pool.query(insertClerk, [username, password,]);
      res.status(200).json({ message: 'User added', user: result.rows[0] });
    } catch (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'Error during insertion' });
    }
  });
  
  app.post('/register-triage', async (req, res) => {
    const { username, password} = req.body;
  
    const insertClerk = 'INSERT INTO triage (username, password) VALUES ($1, $2) RETURNING *';
  
    try {
      const result = await pool.query(insertClerk, [username, password,]);
      res.status(200).json({ message: 'Triage added', user: result.rows[0] });
    } catch (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'Error during insertion' });
    }
  });
  app.post('/register-pharma', async (req, res) => {
    const { username, password} = req.body;
  
    const insertpharma = 'INSERT INTO pharma (username, password) VALUES ($1, $2) RETURNING *';
  
    try {
      const result = await pool.query(insertpharma, [username, password,]);
      res.status(200).json({ message: 'Pharma added', user: result.rows[0] });
    } catch (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'Error during insertion' });
    }
  });

  app.get('/assigned-patients', async (req, res) => {
    try {
      const query = 'SELECT * FROM patients ORDER BY registered_at DESC';
      const result = await pool.query(query);
      res.status(200).json(result.rows);
    } catch (err) {
      console.error('Error fetching patients:', err);
      res.status(500).json({ error: 'Failed to fetch patients' });
    }
  });

  app.get('/assigned-existing-patients', async (req, res) => {
    try {
      const queryUpdate = 'SELECT * FROM patients ORDER BY registered_at DESC';
      const result = await pool.query(queryUpdate);
      res.status(200).json(result.rows);
    } catch (err) {
      console.error('Error fetching patients:', err);
      res.status(500).json({ error: 'Failed to fetch patients' });
    }
  });
  
  app.post('/assign-patient', async (req, res) => {
    const {
      cardno, fname, mname, lname,
      date_of_birth, sex, kebele,type, registered_at
    } = req.body;
  
    if (!cardno || !fname || !lname || !date_of_birth || !sex || !kebele || !type || !registered_at) {
      return res.status(400).json({ error: 'Missing required patient data' });
    }
  
    try {
      const insertQuery = `
        INSERT INTO assigned_patients (
          cardno, fname, mname, lname,
          date_of_birth, sex, kebele, type, registered_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `;
  
      await pool.query(insertQuery, [
        cardno, fname, mname, lname,
        date_of_birth, sex, kebele, type, registered_at
      ]);
  
      const fetchQuery = `
        SELECT *
              FROM assigned_patients
              WHERE registered_at >= NOW() - INTERVAL '4 hours'
              ORDER BY registered_at DESC;
      `;
  
      const result = await pool.query(fetchQuery);
      const latestPatient = result.rows[0];
  
      res.status(201).json({
        message: 'Patient assigned successfully',
        patient: latestPatient,
      });
    } catch (err) {
      console.error('Assignment error:', err.stack);
  
      if (err.code === '23505') {
        return res.status(400).json({ error: 'Patient already assigned' });
      }
  
      res.status(500).json({ error: 'Failed to assign patient' });
    }
  });
  
app.get('/doctor-notifications/type', async (req, res) => {
  const {type} = req.query;
  try {
    const result = await pool.query(
      `SELECT * FROM assigned_patients WHERE LOWER(type) = LOWER($1) ORDER BY registered_at DESC`,
      [type]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching doctor notifications:', error);
    res.status(500).json({ error: 'Server error while fetching notifications' });
  }
});



  app.post('/accept-patient', (req, res) => {
    const { cardno } = req.body;
    const index = patients.findIndex((p) => p.cardno === cardno);
    if (index !== -1) {
      patients[index].accepted = true;
      res.status(200).json({ message: 'Patient accepted' });
    } else {
      res.status(404).json({ message: 'Patient not found' });
    }
  });
  
app.post('/patient-history', async (req, res) => {
  const {
    cardno, fname, mname, lname, date_of_birth,
    sex, kebele, diagnosis, treatment, lab_checkups
  } = req.body;

  try {
    await pool.query(
      `INSERT INTO patienthistory (
        cardno, fname, mname, lname, date_of_birth,
        sex, kebele, diagnosis, treatment, lab_checkups
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [cardno, fname, mname, lname, date_of_birth,
       sex, kebele, diagnosis, treatment, lab_checkups]
    );
    res.status(201).json({ message: 'Patient history saved successfully' });
  } catch (err) {
    console.error('Error saving history:', err);
    res.status(500).json({ error: 'Failed to save patient history' });
  }
});


app.post('/lab-requests', async (req, res) => {
  const { cardno, fullname, diagnosis, treatment, lab_checkups } = req.body;

  try {
    await pool.query(
      `INSERT INTO labrequests (
        cardno, fullname, diagnosis, treatment, lab_checkups
      ) VALUES ($1,$2,$3,$4,$5)`,
      [cardno, fullname, diagnosis, treatment, lab_checkups]
    );
    res.status(201).json({ message: 'Lab request sent successfully' });
  } catch (err) {
    console.error('Error sending lab request:', err);
    res.status(500).json({ error: 'Failed to send lab request' });
  }
});

app.get('/lab-requests', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM labrequests');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching lab requests:', err);
    res.status(500).json({ error: 'Failed to fetch lab requests' });
  }
});

app.post('/lab-results/send', async (req, res) => {
  const {
    cardno,
    fullname,
    diagnosis,
    treatment,
    lab_checkups,
    lab_result,
  } = req.body;

  try {
    await pool.query(
      `INSERT INTO lab_results (
        cardno, fullname, diagnosis, treatment, lab_checkups, lab_result
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [cardno, fullname, diagnosis, treatment, lab_checkups, lab_result]
    );

    res.status(201).json({ message: 'Lab result sent to doctor successfully' });
  } catch (err) {
    console.error('Error saving lab result:', err);
    res.status(500).json({ error: 'Failed to save lab result' });
  }
});


/*app.get('/lab-results', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM lab_results ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching lab results:', err);
    res.status(500).json({ error: 'Failed to fetch lab results' });
  }
});*/


/*app.get('/lab-results/:treatment', async (req, res) => {
  const treatment = req.params.treatment; // e.g., 'Eye', 'Brain', 'Skin'

  try {
    const query = `
      SELECT * FROM lab_results
      WHERE LOWER(treatment) = LOWER($1)
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query, [treatment]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching lab results by treatment:', err);
    res.status(500).json({ error: 'Failed to fetch filtered lab results' });
  }
});*/

app.get('/lab-results', async (req, res) => {
  try {
    const specialty = req.query.specialty || '';

    const queryText = specialty
      ? 'SELECT * FROM lab_results WHERE LOWER(treatment) = $1 ORDER BY created_at DESC'
      : 'SELECT * FROM lab_results ORDER BY created_at DESC';

    const params = specialty ? [specialty.toLowerCase()] : [];

    const result = await pool.query(queryText, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching lab results:', err);
    res.status(500).json({ error: 'Failed to fetch lab results' });
  }
});



app.post('/send-to-pharmacist', async (req, res) => {
  const {
    cardno,
    fullname,
    diagnosis,
    treatment,
    lab_checkups,
    lab_result,
    doctor_note,
  } = req.body;

  try {
    await pool.query(
      `INSERT INTO pharmacyrequests (
        cardno, fullname, diagnosis, treatment, lab_checkups, lab_result, doctor_note
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [cardno, fullname, diagnosis, treatment, lab_checkups, lab_result, doctor_note]
    );

    res.status(201).json({ message: 'Data sent to pharmacist' });
  } catch (err) {
    console.error('Failed to send to pharmacist:', err);
    res.status(500).json({ error: 'Could not send to pharmacist' });
  }
});

app.post('/update-and-send-to-triage', async (req, res) => {
  const { cardno } = req.body;

  try {
    const updateQuery = `
      UPDATE patients 
      SET registered_at = NOW() 
      WHERE cardno = $1
    `;
    const result = await pool.query(updateQuery, [cardno]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.status(200).json({ message: 'Patient sent to triage successfully' });
  } catch (err) {
    console.error('Error updating patient:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/doctor/:type/inbox', (req, res) => {
  const { type } = req.params;

  if (!doctorInboxes[type]) {
    return res.status(404).json({ message: 'Doctor not found' });
  }

  res.status(200).json(doctorInboxes[type]);
});

app.get('/patient/:cardno', async (req, res) => {
  const { cardno } = req.params;

  try {
    const query = 'SELECT * FROM patients WHERE cardno = $1';
    const result = await pool.query(query, [cardno]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching patient:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/display-patient', async (req, res) => {
  const { cardno } = req.body;

  try {
    const query = `
      UPDATE patients
      SET registered_at = NOW()
      WHERE cardno = $1
      RETURNING *
    `;
    const result = await pool.query(query, [cardno]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Error assigning patient:', err);
    res.status(500).json({ error: 'Server error during assignment' });
  }
});

app.get('/latest-patient', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM patients
      ORDER BY registered_at DESC
      LIMIT 1
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching latest patient:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Entro SW Developers, your server is running on port ${port}`);
});


