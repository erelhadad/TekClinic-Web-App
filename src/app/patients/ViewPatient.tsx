import React from 'react'
import { type Session } from 'next-auth'
import {
  Avatar,
  Box,
  Divider,
  Group,
  Text,
  Stack,
  Paper,
  Title,
  Badge,
  type MantineColorScheme,
} from '@mantine/core'
import { type Patient } from '@/src/api/model/patient'
import male_avatar from '@/public/male-patient.webp'
import female_avatar from '@/public/female-patient.webp'
import unknown_avatar from '@/public/unknown-patient.webp'
import { Appointment } from '@/src/api/model/appointment'
import { Task } from '@/src/api/model/task'
import PhoneNumber from '@/src/components/PhoneNumber'
import Languages from '@/src/components/Languages'

async function loadPatientAppointments(
  patientId: number,
  session: Session
): Promise<Appointment[]> {
  const { items: appointments } = await Appointment.get(
    { patient_id: patientId },
    session
  )
  return appointments
}

async function loadPatientTasks(
  patientId: number,
  session: Session
): Promise<Task[]> {
  const response = await Task.getByPatientId(patientId, session)
  return response
}

function padTwoDigits(num: number): string {
  return num.toString().padStart(2, '0')
}

const AppointmentDate: React.FC<{ date: Date }> = ({ date }) =>
  `${date.getFullYear()}-${padTwoDigits(date.getMonth() + 1)}-${padTwoDigits(
    date.getDate()
  )}`

const AppointmentTime: React.FC<{ date: Date }> = ({ date }) =>
  `${padTwoDigits(date.getHours())}:${padTwoDigits(date.getMinutes())}`

const ViewAppointment: React.FC<{ appointment: Appointment; session: Session }> = ({
  appointment,
  session,
}) => {
  const [doctorName, setDoctorName] = React.useState<string | null>(null)
  const [error, setError] = React.useState(false)

  React.useEffect(() => {
    appointment
      .loadDoctor(session)
      .then(() => setDoctorName(appointment.getDoctorName()))
      .catch(() => setError(true))
  }, [appointment, session])

  const { start_time: startTime, end_time: endTime } = appointment

  return (
    <Paper
      shadow="md"
      mb="xs"
      bg="green"
      w="100%"
      display="inline-block"
      pl="xs"
      pr="xs"
      c="black"
    >
      <Group>
        <AppointmentDate date={startTime} /> <AppointmentTime date={startTime} />-
        <AppointmentTime date={endTime} />:
        <Text m="auto">
          {doctorName ?? (error ? 'Could not load doctor' : 'Loading name...')}
        </Text>
      </Group>
    </Paper>
  )
}

const ViewPatientTasks: React.FC<{ patientId: number; session: Session }> = ({
  patientId,
  session,
}) => {
  const [tasks, setTasks] = React.useState<Task[] | null>(null)
  const [error, setError] = React.useState(false)

  React.useEffect(() => {
    loadPatientTasks(patientId, session)
      .then((tasks) => setTasks(tasks))
      .catch(() => setError(true))
  }, [patientId, session])

  // Mock data for demonstration
  React.useEffect(() => {
    const mockTasks: Task[] = [
      new Task({
        id: 1,
        title: 'Mock Title 1',
        description: 'Mock Task 1',
        complete: false,
        created_at: new Date().toISOString(),
        patient_id: patientId,
        expertise: 'General',
      }),
      new Task({
        id: 2,
        title: 'Mock Title 2',
        description: 'Mock Task 2',
        complete: true,
        created_at: new Date().toISOString(),
        patient_id: patientId,
        expertise: 'Specialist',
      }),
    ]
    setTasks(mockTasks)
  }, [patientId])

  if (tasks === null) return <Text>Loading tasks...</Text>
  if (error) return <Text>Error loading tasks.</Text>

  return (
    <Box mt="md">
      {/* Section header with underline */}
      <Title
        order={5}
        mb="md"
        style={{
          borderBottom: '2px solid rgba(0, 0, 0, 0.1)',
          paddingBottom: '0.25rem',
        }}
      >
        Tasks
      </Title>

      <Stack>
        {tasks.map((task) => (
          <Paper key={task.id} mb="xs" shadow="xs" p="md" withBorder>
            <Group position="apart" align="flex-start" mb="xs">
              {/* Task title */}
              <Text
                style={{ fontSize: '1.125rem', fontWeight: 500 }}
              >
                {task.title}
              </Text>

              {/* Status badge */}
              <Badge color={task.complete ? 'green' : 'gray'}>
                {task.complete ? 'Complete' : 'Incomplete'}
              </Badge>
            </Group>

            {task.description && (
              <Text
                style={{
                  color: 'rgba(0, 0, 0, 0.6)',
                  fontSize: '0.875rem',
                  marginBottom: '0.5rem',
                }}
              >
                {task.description}
              </Text>
            )}

            <Divider />
          </Paper>
        ))}
      </Stack>
    </Box>
  )
}

const ViewPatientAppointments: React.FC<{ patientId: number; session: Session }> = ({
  patientId,
  session,
}) => {
  const [appointments, setAppointments] = React.useState<Appointment[] | null>(
    null
  )
  const [error, setError] = React.useState(false)

  React.useEffect(() => {
    loadPatientAppointments(patientId, session)
      .then((apps) => setAppointments(apps))
      .catch((err) => {
        console.error('Error for id:', patientId, err)
        setError(true)
      })
  }, [patientId, session])

  if (appointments === null) return <Text>Loading appointments...</Text>
  if (error) return <Text>Error loading appointments.</Text>

  return (
    <Box>
      <Text>
        <strong>Appointments:</strong>
      </Text>
      {appointments.map((appointment) => (
        <ViewAppointment
          key={appointment.id}
          appointment={appointment}
          session={session}
        />
      ))}
    </Box>
  )
}

interface ViewPatientProps {
  computedColorScheme: MantineColorScheme
  patient: Patient
  session: Session
}

const ViewPatient: React.FC<ViewPatientProps> = ({
  session,
  computedColorScheme,
  patient,
}) => (
  <Box>
    <Group align="flex-start">
      <Avatar
        size={120}
        radius="120px"
        src={
          patient.gender === 'male'
            ? male_avatar.src
            : patient.gender === 'female'
            ? female_avatar.src
            : unknown_avatar.src
        }
        alt="Patient photo"
      />
      <Stack>
        <Box>
          <Text>
            <strong>Name:</strong> {patient.name}
          </Text>
          <Text>
            <strong>Age:</strong> {patient.age}
          </Text>
          <Text>
            <strong>Gender:</strong> {patient.gender}
          </Text>
          {patient.phone_number !== undefined && (
            <Text>
              <strong>Phone:</strong> <PhoneNumber number={patient.phone_number} />
            </Text>
          )}
          <Text>
            <strong>Birth Date:</strong> {patient.birth_date.toLocaleDateString()}
          </Text>

          <Text>
            <strong>Languages:</strong>
          </Text>
          <Languages languages={patient.languages} />

          {patient.referred_by !== null && (
            <Text>
              <strong>Referred By:</strong> {patient.referred_by}
            </Text>
          )}
          {patient.special_note !== null && (
            <Text>
              <strong>Special Note:</strong> {patient.special_note}
            </Text>
          )}
        </Box>

        {patient.emergency_contacts.length !== 0 && <Divider my="sm" />}

        <Box>
          {patient.emergency_contacts.length !== 0 && (
            <Text>
              <strong>Emergency Contacts:</strong>
            </Text>
          )}
          <Stack>
            {patient.emergency_contacts.map((contact, idx) => (
              <Box key={idx}>
                <Text>
                  <strong>Name:</strong> {contact.name}
                </Text>
                <Text>
                  <strong>Relation:</strong> {contact.closeness}
                </Text>
                <Text>
                  <strong>Phone:</strong> {contact.phone}
                </Text>
              </Box>
            ))}
          </Stack>
        </Box>
      </Stack>
    </Group>

    <Divider my="sm" />

    <ViewPatientAppointments patientId={patient.id} session={session} />

    <Box>
      <Divider my="sm" />
      <ViewPatientTasks patientId={patient.id} session={session} />
    </Box>
  </Box>
)

export default ViewPatient
