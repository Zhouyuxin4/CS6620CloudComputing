import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Image } from 'lucide-react';
import './css/Homepage.css';
import Layout from './Layout';

function Homepage(){
  const navigate = useNavigate();
  return(
    <Layout>
    <div className='homepage'>
      <div className='intro-box'>
        <div className='intro-box-top'>
          <h1>Your Own Planet</h1>
          <h2>Explore - Record - Remember</h2>
        </div>
        <div className='intro-box-bottom'>
          <p>The platform where every journey becomes a constellation of memories, whether they sparkle from distant horizons or glow softly in your own backyard.</p>
          <button className='signIn-button' onClick={()=>navigate('/signin')}>Let's get started!</button>
        </div>
      </div>

      <div className='detail-intro'>
        <p>
        Here, each destination transforms into a star in your personal universe - from the whispers of dawn in Paris to the familiar comfort of your favorite neighborhood café. Through photos and stories, capture the dance of cherry blossoms in Tokyo, the gentle waves of a hidden beach in Bali, or the golden light of a sunset walk in your local park.
        This is more than just a travel platform - it's your personal anthology of adventures and everyday discoveries. A weekend getaway to a nearby town can be just as meaningful as a journey across continents, because sometimes the most beautiful moments are hiding in plain sight, waiting to be captured through your lens and words.
        Begin mapping your world of memories today, and watch as they weave together into a tapestry that's uniquely yours.
        </p>
      </div>

      <div className="feature-grid">
        <div className="feature-item">
          <div className="feature-icon">
            <Image size={32} />
          </div>
          <h3>Capture Beautiful Moments</h3>
          <p>Save scenic views, street corners, sunset moments or any spot that catches your eye.</p>
        </div>
        <div className="feature-item">
          <div className="feature-icon">
            <FileText size={32} />
          </div>
          <h3>Record Your Stories</h3>
          <p>Write down your thoughts, experiences, and the little details you never want to forget.</p>
        </div>
        <div className="feature-item">
          <div className="feature-icon">
            <Upload size={32} />
          </div>
          <h3>Build Your Collection</h3>
          <p>Upload and organize your travel memories, creating your personal journey archive.</p>
        </div>
      </div>

    </div>
    </Layout>
  )
}
export default Homepage;