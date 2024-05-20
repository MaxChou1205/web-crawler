export default function handler(req, res) {
  console.log('Cron job executed');
  res.status(200).json({ message: 'Cron job executed successfully' });
}